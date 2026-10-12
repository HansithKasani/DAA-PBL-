// Benchmarking Engine, Risk Classifier, and Canvas Chart Renderer

// ==========================================
// Risk Threshold Reader
// ==========================================
// Reads user-configured thresholds from the sidebar inputs.
// Falls back to defaults when running headless (Node.js test environment).
function getRiskThresholds() {
  if (typeof document === 'undefined') {
    return { mod: 50, high: 1000, to: 5000 };
  }
  var modInput = document.getElementById('th-mod');
  var highInput = document.getElementById('th-high');
  var toInput = document.getElementById('th-to');

  return {
    mod: modInput ? Math.max(1, parseFloat(modInput.value) || 50) : 50,
    high: highInput ? Math.max(1, parseFloat(highInput.value) || 1000) : 1000,
    to: toInput ? Math.max(0.5, parseFloat(toInput.value) || 5) * 1000 : 5000
  };
}

// ==========================================
// Single Algorithm Execution
// ==========================================
// Generates input, runs the algorithm under a safety deadline,
// then verifies correctness AFTER timing.
function executeSingleRun(algName, n, family, seed) {
  var alg = A[algName];
  if (!alg) throw new Error("Algorithm '" + algName + "' not registered");

  var input = alg.gen(n, family, seed);
  var thresholds = getRiskThresholds();

  EXECUTION_DEADLINE = performance.now() + thresholds.to;

  // STRICT RULE: Time ONLY the algorithm execution
  var t0 = performance.now();
  var result;
  try {
    result = alg.run(input, null);
  } catch (err) {
    if (err === 'timeout') {
      result = {
        ops: 0, st: 0, pr: 0, mem: 0, th: 1,
        to: true,
        info: 'Execution hit the safety deadline timeout',
        ok: false
      };
    } else {
      throw err;
    }
  }
  var ms = performance.now() - t0;

  // Verification step runs AFTER timing
  if (result.v) {
    try { result.ok = result.v(); }
    catch (e) { result.ok = false; }
  } else if (result.ok === undefined) {
    result.ok = true;
  }

  return { input: input, result: result, ms: ms, to: Boolean(result.to) };
}

// ==========================================
// Risk Classifier
// ==========================================
// Assigns LOW / MODERATE / HIGH based on execution latency
// and empirical growth slope relative to the first data point.
function classifyRisk(ms, timedOut, empiricalGrowthSlope) {
  var th = getRiskThresholds();

  if (timedOut || ms >= th.high) {
    var reason = timedOut
      ? 'Execution hit the ' + (th.to / 1000) + 's safety deadline or memory allocation limit. Exact computation is infeasible for this workload.'
      : 'Measured execution time (' + ms.toFixed(1) + ' ms) >= High Risk threshold (' + th.high + ' ms). The technique is undesirable or impractical for this input scale.';
    return ['HIGH', reason];
  }

  if (ms >= th.mod || empiricalGrowthSlope >= 4.0) {
    var reason2 = ms >= th.mod
      ? 'Measured execution time (' + ms.toFixed(1) + ' ms) >= Moderate threshold (' + th.mod + ' ms). Growing noticeable latency.'
      : 'Steep empirical growth rate observed. Practical at this scale but scales poorly.';
    return ['MODERATE', reason2];
  }

  return [
    'LOW',
    'Measured time (' + ms.toFixed(2) + ' ms) < ' + th.mod + ' ms with sub-critical growth. Practical for production workload.'
  ];
}

// ==========================================
// Benchmark Suite Runner
// ==========================================
// Sweeps sizes from startN to endN, running multiple trials per size.
// Returns an array of data rows for charting.
//
// Parameters:
//   algName      - registered algorithm key
//   startN       - starting size
//   endN         - ending size
//   stepN        - size increment
//   family       - test family string
//   runsPerSize  - how many repetitions per size
//   onProgress   - callback(progressFraction) for progress bar
//   checkCancel  - callback() returning true to abort
async function runBenchmarkSuite(algName, startN, endN, stepN, family, runsPerSize, onProgress, checkCancel) {
  var results = [];
  var totalSteps = Math.max(1, Math.floor((endN - startN) / stepN) + 1);
  var currentStep = 0;
  var seed = 1;

  for (var n = startN; n <= endN; n += stepN) {
    if (checkCancel && checkCancel()) break;

    var times = [];
    var lastExec = null;

    for (var r = 0; r < runsPerSize; r++) {
      if (checkCancel && checkCancel()) break;
      lastExec = executeSingleRun(algName, n, family, seed);
      times.push(lastExec.ms);
      // Yield to UI so Stop button remains responsive
      await new Promise(function(resolve) { setTimeout(resolve, 0); });
    }

    if (times.length === 0) break;

    // Median time (sort and pick middle)
    times.sort(function(a, b) { return a - b; });
    var medianIdx = Math.floor(times.length / 2);
    var timeMedian = times.length % 2 === 1 ? times[medianIdx] : (times[medianIdx - 1] + times[medianIdx]) / 2;

    // Empirical growth slope relative to first data point
    var firstPoint = results[0];
    var empiricalSlope = 0;
    if (firstPoint && n > firstPoint.n && firstPoint.ops > 0) {
      var opsRatio = Math.max(1, lastExec.result.ops) / Math.max(1, firstPoint.ops);
      var sizeRatio = n / firstPoint.n;
      empiricalSlope = Math.log(opsRatio) / Math.log(sizeRatio);
    }

    var riskResult = classifyRisk(timeMedian, lastExec.to, empiricalSlope);

    // Ratio = Ops / Theory model value
    var ratio = lastExec.result.th > 0 ? lastExec.result.ops / lastExec.result.th : null;

    var dataRow = {
      n: n,
      timeMedian: timeMedian,
      ops: lastExec.result.ops,
      st: lastExec.result.st || 0,
      pr: lastExec.result.pr || 0,
      th: lastExec.result.th,
      ratio: ratio,
      risk: riskResult[0],
      why: riskResult[1],
      to: lastExec.to,
      ok: lastExec.result.ok,
      mem: lastExec.result.mem || 0,
      info: lastExec.result.info
    };

    results.push(dataRow);
    currentStep++;
    if (onProgress) onProgress(currentStep / totalSteps);

    if (lastExec.to) break; // Stop early on timeout
  }

  return results;
}

// ==========================================
// Benchmark Chart Canvas Renderer
// ==========================================
// Draws Time / Ops / Theoretical curves on a <canvas> element.
function renderBenchmarkChart(canvasId, points) {
  if (typeof document === 'undefined') return;
  var canvas = document.getElementById(canvasId);
  if (!canvas || !points || points.length === 0) return;

  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var dark = document.body && document.body.dataset.theme === 'dark';

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = dark ? '#111827' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  var padLeft = 50;
  var padRight = 24;
  var padTop = 30;
  var padBottom = 28;
  var plotW = w - padLeft - padRight;
  var plotH = h - padTop - padBottom;

  // Grid lines
  ctx.strokeStyle = dark ? '#1f2937' : '#f1f5f9';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 4; i++) {
    var y = padTop + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
  }

  var maxTime = Math.max.apply(null, points.map(function(p) { return p.timeMedian; }));
  if (maxTime < 0.001) maxTime = 0.001;
  var maxOps = Math.max.apply(null, points.map(function(p) { return p.ops; }));
  if (maxOps < 1) maxOps = 1;
  var lastPt = points[points.length - 1];
  var theoryScale = lastPt.ops / Math.max(1, lastPt.th);

  function getX(index) {
    if (points.length === 1) return padLeft + plotW / 2;
    return padLeft + index * (plotW / (points.length - 1));
  }

  function drawSeries(getValue, color, dashed) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [5, 3] : []);

    points.forEach(function(p, i) {
      var val = getValue(p);
      var norm = Math.max(0, Math.min(1, val));
      var x = getX(i);
      var yy = padTop + plotH - norm * plotH;
      if (i === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw dots
    points.forEach(function(p, i) {
      var val = getValue(p);
      var norm = Math.max(0, Math.min(1, val));
      var x = getX(i);
      var yy = padTop + plotH - norm * plotH;
      ctx.beginPath();
      ctx.arc(x, yy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = dark ? '#111827' : '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  // 1. Observed Time (Blue)
  var timeColor = dark ? '#60a5fa' : '#2563eb';
  drawSeries(function(p) { return p.timeMedian / maxTime; }, timeColor, false);

  // 2. Observed Operations (Slate)
  var opsColor = dark ? '#f8fafc' : '#0f172a';
  drawSeries(function(p) { return p.ops / maxOps; }, opsColor, false);

  // 3. Theoretical Model Bound (Green, dashed)
  var theoryColor = dark ? '#4ade80' : '#16a34a';
  drawSeries(function(p) { return (p.th * theoryScale) / maxOps; }, theoryColor, true);

  // X-axis size labels
  ctx.fillStyle = dark ? '#94a3b8' : '#64748b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  points.forEach(function(p, i) {
    ctx.fillText('n=' + p.n, getX(i), h - 8);
  });

  // Legend
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = timeColor;
  ctx.fillText('-- Measured Time (ms)', padLeft, 16);

  ctx.fillStyle = opsColor;
  ctx.fillText('-- Measured Operations', padLeft + 160, 16);

  ctx.fillStyle = theoryColor;
  ctx.fillText('-- Theoretical Bound', padLeft + 330, 16);
}

// ==========================================
// Format Bytes Utility
// ==========================================
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ==========================================
// Global Exports
// ==========================================
if (typeof globalThis !== 'undefined') {
  globalThis.getRiskThresholds = getRiskThresholds;
  globalThis.executeSingleRun = executeSingleRun;
  globalThis.classifyRisk = classifyRisk;
  globalThis.runBenchmarkSuite = runBenchmarkSuite;
  globalThis.renderBenchmarkChart = renderBenchmarkChart;
  globalThis.formatBytes = formatBytes;
}
