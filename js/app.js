// DAA Algorithm Vulnerability & Stress-Testing Laboratory
// UI Controller — Clean Student Project Layout

// =========================================================
// Global State
// =========================================================
var currentView      = 'dashboard';
var currentAlgorithm = 'Binomial Heap';
var currentTab       = 'console';
var experimentHistory = JSON.parse(localStorage.getItem('daa_history') || '[]');
var executionSteps   = [];
var currentStepIndex = 0;
var stepperTimer     = null;
var benchmarkCancel  = false;
var currentTheme     = localStorage.getItem('daa_theme') || 'light';

// =========================================================
// DAA Syllabus Module Map
// =========================================================
var SYLLABUS = {
  'Binomial Heap':      { module: 'Module I',   topic: 'Advanced Data Structures — Binomial Heaps' },
  'Fibonacci Heap':     { module: 'Module II',  topic: 'Advanced Data Structures — Fibonacci Heaps' },
  'B-Tree':             { module: 'Module I',   topic: 'Advanced Data Structures — B-Trees' },
  'Red-Black Tree':     { module: 'Module II',  topic: 'Advanced Data Structures — Red-Black Trees' },
  'Prim':               { module: 'Module III', topic: 'Graph Algorithms — Prim\'s MST (Greedy)' },
  'Kruskal':            { module: 'Module III', topic: 'Graph Algorithms — Kruskal\'s MST + Union-Find' },
  'Fractional Knapsack':{ module: 'Module II',  topic: 'Greedy Methods — Fractional Knapsack' },
  '0/1 Knapsack':       { module: 'Module I',   topic: 'Dynamic Programming — 0/1 Knapsack' },
  'Floyd-Warshall':     { module: 'Module III', topic: 'Dynamic Programming — All-Pairs Shortest Paths' },
  'Matrix Chain':       { module: 'Module I',   topic: 'Dynamic Programming — Matrix Chain Multiplication' },
  'N-Queens':           { module: 'Module I',   topic: 'Backtracking — N-Queens' },
  'Hamiltonian':        { module: 'Module I',   topic: 'Backtracking — Hamiltonian Cycle' },
  'TSP':                { module: 'Module I',   topic: 'Branch and Bound — Travelling Salesman Problem' }
};

// NP Complexity reference table
var COMPLEXITY_TABLE = [
  { problem: 'Hamiltonian Cycle', decision: 'Does a simple cycle visiting all vertices exist? (YES/NO)', optimization: 'Find such a cycle', status: 'NP-complete (Decision) / NP-hard (Search)', note: 'A candidate can be verified in O(V), so it is in NP. Finding one is exponential worst-case.' },
  { problem: 'TSP',               decision: 'Does a tour with cost <= K exist? (YES/NO)', optimization: 'Find minimum-cost tour', status: 'NP-complete (Decision) / NP-hard (Optimization)', note: 'Optimization form outputs a value rather than YES/NO, so it is NP-hard but not NP-complete.' },
  { problem: '0/1 Knapsack',      decision: 'Is there a subset with weight <= W and value >= V?', optimization: 'Maximize value subject to weight <= W', status: 'NP-complete (Decision) / DP is Pseudo-Polynomial', note: 'O(nC) DP looks polynomial but is exponential in the input bit-length of C.' },
  { problem: 'Fractional Knapsack', decision: '—', optimization: 'Maximize value with fractional items allowed', status: 'In P — Greedy O(n log n)', note: 'Divisibility gives the greedy-choice property; sorting by value/weight ratio is provably optimal.' },
  { problem: 'N-Queens',          decision: 'Does a valid placement exist? (Always YES for n >= 4)', optimization: 'Find one or all valid placements', status: 'NOT NP-complete — polynomial constructions exist', note: 'Backtracking is exponential for exhaustive enumeration, but polynomial solutions exist for a single answer.' },
  { problem: 'MST (Prim/Kruskal)', decision: 'Is there a spanning tree with weight <= W?', optimization: 'Find minimum spanning tree', status: 'In P — O(E log V)', note: 'Matroid greedy property ensures locally optimal edge picks give global minimum spanning trees.' },
  { problem: 'Floyd-Warshall / MCM', decision: '—', optimization: 'All-pairs shortest paths / optimal matrix parenthesization', status: 'In P — Theta(V^3) / Theta(n^3)', note: 'DP eliminates exponential sub-problem recomputation, giving strictly polynomial runtime.' }
];

// =========================================================
// Helpers
// =========================================================
function $(id) { return document.getElementById(id); }

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem('daa_theme', theme);

  var btnL = $('btn-light');
  var btnD = $('btn-dark');
  if (btnL) btnL.classList.toggle('active', theme === 'light');
  if (btnD) btnD.classList.toggle('active', theme === 'dark');
}

// =========================================================
// App Init
// =========================================================
function initApp() {
  applyTheme(currentTheme);
  buildSidebar();
  navigate('dashboard');
}

// =========================================================
// Sidebar
// =========================================================
function buildSidebar() {
  var nav = $('sidebar-nav');
  if (!nav) return;

  var html = '';

  // Project header
  html += '<div class="project-header">';
  html +=   '<div class="project-title">DAA Lab</div>';
  html +=   '<div class="project-sub">Algorithm Vulnerability &amp; Stress-Testing</div>';
  html += '</div>';

  // Theme toggle
  html += '<div class="theme-row">';
  html +=   '<label>Theme</label>';
  html +=   '<div class="theme-toggle">';
  html +=     '<button id="btn-light" onclick="applyTheme(\'light\')" class="' + (currentTheme === 'light' ? 'active' : '') + '">Light</button>';
  html +=     '<button id="btn-dark"  onclick="applyTheme(\'dark\')"  class="' + (currentTheme === 'dark'  ? 'active' : '') + '">Dark</button>';
  html +=   '</div>';
  html += '</div>';

  // Main nav links
  html += '<div class="nav-section-label">Overview</div>';
  html += navLink('dashboard',   'Dashboard',        'Home',    currentView === 'dashboard');
  html += navLink('tests',       'Acceptance Tests',  '10',     currentView === 'tests');
  html += navLink('complexity',  'Complexity Matrix', 'P/NP',   currentView === 'complexity');
  html += navLink('history',     'Experiment Log',    experimentHistory.length, currentView === 'history');

  // Algorithm links grouped by category
  var groups = {};
  for (var key in A) {
    var cat = A[key].category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(key);
  }

  for (var cat in groups) {
    html += '<div class="nav-section-label">' + cat + '</div>';
    groups[cat].forEach(function(name) {
      var syl = SYLLABUS[name];
      var isActive = currentView === 'algorithm' && currentAlgorithm === name;
      html += navLink('alg:' + name, name, syl ? syl.module : '', isActive);
    });
  }

  // Risk threshold config
  html += '<div class="sidebar-config">';
  html +=   '<div class="nav-section-label" style="padding-left:0;">Risk Thresholds</div>';
  html +=   '<label>Moderate (ms)</label>';
  html +=   '<input type="number" id="th-mod" value="50" style="width:100%;">';
  html +=   '<label>High (ms)</label>';
  html +=   '<input type="number" id="th-high" value="1000" style="width:100%;">';
  html +=   '<label>Timeout (s)</label>';
  html +=   '<input type="number" id="th-to" value="5" style="width:100%;">';
  html += '</div>';

  nav.innerHTML = html;
}

function navLink(viewKey, label, badge, isActive) {
  var onclick = viewKey.startsWith('alg:')
    ? 'openAlgorithm(\'' + viewKey.slice(4) + '\')'
    : 'navigate(\'' + viewKey + '\')';
  var activeClass = isActive ? ' active' : '';
  var badgeHtml = badge !== '' && badge !== undefined
    ? '<span class="nav-badge">' + badge + '</span>'
    : '';
  return '<a class="' + activeClass + '" onclick="' + onclick + '">' +
           '<span>' + label + '</span>' + badgeHtml +
         '</a>';
}

function markActive(viewKey) {
  document.querySelectorAll('#sidebar-nav a').forEach(function(a) {
    a.classList.remove('active');
  });
}

// =========================================================
// Navigation
// =========================================================
function navigate(viewName) {
  currentView = viewName;
  var main = $('main-content');
  if (!main) return;
  buildSidebar(); // Rebuild to reflect active link

  if (viewName === 'dashboard')  renderDashboard(main);
  else if (viewName === 'tests') renderTestsPage(main);
  else if (viewName === 'complexity') renderComplexityPage(main);
  else if (viewName === 'history')    renderHistoryPage(main);
}

function openAlgorithm(name, tab) {
  currentAlgorithm = name;
  currentView = 'algorithm';
  currentTab = tab || 'console';
  buildSidebar();
  var main = $('main-content');
  if (main) renderAlgorithmPage(main, name);
}

function switchTab(tab) {
  currentTab = tab;
  var main = $('main-content');
  if (main && currentView === 'algorithm') renderAlgorithmPage(main, currentAlgorithm);
}

// =========================================================
// View: Dashboard
// =========================================================
function renderDashboard(main) {
  var total  = Object.keys(A).length;
  var runs   = experimentHistory.length;
  var passed = experimentHistory.filter(function(r) { return r.ok; }).length;
  var topRisk = '-';
  if (experimentHistory.some(function(r) { return r.risk === 'HIGH'; }))     topRisk = 'HIGH';
  else if (experimentHistory.some(function(r) { return r.risk === 'MODERATE'; })) topRisk = 'MODERATE';
  else if (experimentHistory.some(function(r) { return r.risk === 'LOW'; }))  topRisk = 'LOW';

  var html = '';

  // Page header
  html += '<div class="page-header">';
  html +=   '<div class="breadcrumb">DAA Laboratory / Dashboard</div>';
  html +=   '<h1>Algorithm Vulnerability &amp; Stress-Testing Laboratory</h1>';
  html +=   '<p>B.Tech Semester III &mdash; Design and Analysis of Algorithms &mdash; PBL Project</p>';
  html += '</div>';

  // Stats
  html += '<div class="stat-grid">';
  html += statBox('Algorithms', total);
  html += statBox('Experiments Run', runs);
  html += statBox('Invariants Passed', runs > 0 ? passed + ' / ' + runs : '&mdash;');
  html += statBox('Highest Risk', topRisk !== '-' ? '<span class="pill ' + topRisk + '">' + topRisk + '</span>' : '&mdash;');
  html += '</div>';

  // About card
  html += '<div class="card">';
  html +=   '<div class="card-title">Project Objective</div>';
  html +=   '<p style="font-size:13px;color:var(--text-sub);line-height:1.6;">';
  html +=     'This laboratory answers the core DAA research question: <strong>"Under what input or workload conditions does an algorithm become undesirable or infeasible?"</strong> ';
  html +=     'Every experiment runs the real algorithm on generated input. ';
  html +=     'Time is measured exclusively with <code>performance.now()</code>. Memory figures are element-count estimates. ';
  html +=     'Results are classified as LOW / MODERATE / HIGH risk against configurable thresholds.';
  html +=   '</p>';
  html += '</div>';

  // Algorithm cards
  html += '<div class="card-title" style="margin-bottom:10px;">Algorithms by Category</div>';
  html += '<div class="alg-grid">';

  for (var key in A) {
    var alg = A[key];
    var syl = SYLLABUS[key] || { module: 'DAA', topic: alg.category };
    html += '<div class="alg-card">';
    html +=   '<div class="alg-card-head">' + key + '</div>';
    html +=   '<div class="alg-card-meta">' + alg.cx.split('|')[0].trim() + ' &nbsp;&bull;&nbsp; ' + syl.module + '</div>';
    html +=   '<div class="alg-card-desc">' + syl.topic + '</div>';
    html +=   '<button class="btn-primary btn-sm" onclick="openAlgorithm(\'' + key + '\')">Open Lab Station</button>';
    html += '</div>';
  }

  html += '</div>';
  main.innerHTML = html;
}

function statBox(label, value) {
  return '<div class="stat-box"><div class="stat-label">' + label + '</div><div class="stat-value">' + value + '</div></div>';
}

// =========================================================
// View: Algorithm Lab Station
// =========================================================
function renderAlgorithmPage(main, name) {
  var alg = A[name];
  if (!alg) return;
  var syl = SYLLABUS[name] || { module: 'DAA', topic: alg.category };

  var html = '';

  // Page header
  html += '<div class="page-header">';
  html +=   '<div class="breadcrumb">DAA Laboratory / ' + alg.category + ' / ' + name + '</div>';
  html +=   '<h1>' + name + '</h1>';
  html +=   '<div class="alg-page-tags" style="margin-top:8px;">';
  html +=     '<span class="tag accent">' + syl.module + '</span>';
  html +=     '<span class="tag">' + alg.cx.split('|')[0].trim() + '</span>';
  html +=     '<span class="tag">' + alg.category + '</span>';
  html +=   '</div>';
  html += '</div>';

  // Tabs
  var tabs = ['console', 'scaling', 'dossier', 'report'];
  var tabLabels = { console: 'Stress Console', scaling: 'Scaling Benchmark', dossier: 'Syllabus Dossier', report: 'Diagnostic Report' };
  if (alg.pr) {
    tabs.splice(2, 0, 'battle');
    tabLabels['battle'] = 'Compare vs ' + alg.pr;
  }

  html += '<div class="tabs">';
  tabs.forEach(function(t) {
    html += '<button class="tab-btn' + (currentTab === t ? ' active' : '') + '" onclick="switchTab(\'' + t + '\')">' + tabLabels[t] + '</button>';
  });
  html += '</div>';

  // Tab content
  if (currentTab === 'console')  html += renderConsole(name, alg);
  else if (currentTab === 'scaling') html += renderScaling(name, alg);
  else if (currentTab === 'battle')  html += renderBattle(name, alg);
  else if (currentTab === 'dossier') html += renderDossier(name, alg);
  else if (currentTab === 'report')  html += renderReport(name, alg);

  main.innerHTML = html;

  // Auto-run on load
  if (currentTab === 'console') handleRunSingle(true);
  else if (currentTab === 'battle') runBattle();
}

// =========================================================
// Tab: Stress Console
// =========================================================
function renderConsole(name, alg) {
  var html = '';

  // Metrics HUD
  html += '<div class="metrics-row">';
  html += metricBox('hud-time',   'Execution Time',       '&mdash; ms',     'performance.now() isolated');
  html += metricBox('hud-ops',    'Operations',           '&mdash;',        'Comparisons / iterations');
  html += metricBox('hud-struct', 'Structural Ops',       '&mdash;',        'Rotations / cuts / prunes');
  html += metricBox('hud-mem',    'Memory Estimate',      '&mdash;',        'Element footprint model');
  html += '</div>';

  // Risk banner placeholder
  html += '<div id="risk-banner-container"></div>';

  // Controls
  html += '<div class="card">';
  html +=   '<div class="card-title">Workload Configuration</div>';

  // Preset chips
  html += '<div class="preset-chips">';
  alg.f.forEach(function(fam) {
    html += '<span class="preset-chip" onclick="injectPreset(\'' + fam + '\')">' + fam + '</span>';
  });
  html += '</div>';

  html +=   '<div class="form-row">';
  html +=     formGroup('Size (n)', '<input type="number" id="input-size" value="' + alg.d[0] + '">');
  html +=     formGroup('Test Family', '<select id="select-family">' + alg.f.map(function(f) { return '<option value="' + f + '">' + f + '</option>'; }).join('') + '</select>');
  html +=     formGroup('Seed', '<input type="number" id="input-seed" value="1">');
  html +=     '<button class="btn-primary" onclick="handleRunSingle(false)">Run Experiment</button>';
  html +=   '</div>';
  html +=   '<div class="info-note">Recommended max input size: ' + alg.mx + '. ' + alg.fd + '</div>';
  html += '</div>';

  // Results table
  html += '<div class="card" id="result-card">';
  html +=   '<div class="card-title">Experiment Results</div>';
  html +=   '<div id="result-container"><div class="empty-state">Run an experiment to see results.</div></div>';
  html += '</div>';

  // Step visualizer
  html += '<div class="card">';
  html +=   '<div class="card-title">Step-by-Step Trace <span id="step-counter" class="step-counter">Step 0 / 0</span></div>';
  html +=   '<div class="stepper-controls">';
  html +=     '<button class="btn-secondary btn-sm" onclick="stepViz(-1)">Back</button>';
  html +=     '<button class="btn-secondary btn-sm" onclick="stepViz(1)">Next</button>';
  html +=     '<button class="btn-secondary btn-sm" id="btn-play" onclick="togglePlay()">Play</button>';
  html +=     '<button class="btn-secondary btn-sm" onclick="restartViz()">Restart</button>';
  html +=     '<label style="font-size:11px;color:var(--text-muted);">Speed: <input type="range" id="stepper-speed" min="50" max="1000" value="300"></label>';
  html +=   '</div>';
  html +=   '<div id="step-explanation" class="step-explanation">Press Run Experiment to trace steps.</div>';
  html +=   '<div id="visual-canvas" class="visual-canvas"></div>';
  html +=   '<pre id="step-log" class="step-log"></pre>';
  html +=   '<div class="info-note">Step trace is active for sizes n &lt;= ' + alg.tn + '.</div>';
  html += '</div>';

  return html;
}

function metricBox(id, label, value, sub) {
  return '<div class="metric-box">' +
    '<div class="metric-label">' + label + '</div>' +
    '<div class="metric-value" id="' + id + '">' + value + '</div>' +
    '<div class="metric-sub">' + sub + '</div>' +
  '</div>';
}

function formGroup(label, inputHtml) {
  return '<div class="form-group"><label>' + label + '</label>' + inputHtml + '</div>';
}

// =========================================================
// Tab: Scaling Benchmark
// =========================================================
function renderScaling(name, alg) {
  var html = '';
  html += '<div class="card">';
  html +=   '<div class="card-title">Parametric Size Sweep</div>';
  html +=   '<div class="form-row">';
  html +=     formGroup('Start n', '<input type="number" id="bm-start" value="' + alg.d[1] + '">');
  html +=     formGroup('End n',   '<input type="number" id="bm-end"   value="' + alg.d[2] + '">');
  html +=     formGroup('Step',    '<input type="number" id="bm-step"  value="' + alg.d[3] + '">');
  html +=     formGroup('Runs / Size', '<input type="number" id="bm-runs" value="3">');
  html +=     '<button class="btn-primary" onclick="handleBenchmark()">Start Sweep</button>';
  html +=     '<button class="btn-danger"  onclick="benchmarkCancel=true">Stop</button>';
  html +=     '<progress id="bm-progress" value="0" max="1" style="align-self:flex-end;"></progress>';
  html +=   '</div>';
  html +=   '<div class="info-note">Computes median execution time per size. Yields between runs to keep the page responsive.</div>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="card-title">Empirical Growth vs Theoretical Bound</div>';
  html +=   '<canvas id="bm-chart" width="860" height="220" style="height:220px;"></canvas>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="card-title">Growth Ratio Data</div>';
  html +=   '<div id="bm-table-container"><div class="empty-state">Press Start Sweep to populate the data table.</div></div>';
  html += '</div>';

  return html;
}

// =========================================================
// Tab: Battle Comparison
// =========================================================
function renderBattle(name, alg) {
  var pName = alg.pr;
  if (!pName) return '<div class="card"><div class="empty-state">No partner algorithm configured.</div></div>';

  var html = '';
  html += '<div class="card">';
  html +=   '<div class="card-title">Head-to-Head Comparison: ' + name + ' vs ' + pName + '</div>';
  html +=   '<p style="font-size:13px;color:var(--text-sub);margin-bottom:12px;">Both algorithms run on the <strong>same generated input</strong> (same n, family, seed).</p>';
  html +=   '<div class="form-row">';
  html +=     formGroup('Size (n)', '<input type="number" id="battle-size" value="' + alg.d[0] + '">');
  html +=     formGroup('Family', '<select id="battle-family">' + alg.f.map(function(f) { return '<option>' + f + '</option>'; }).join('') + '</select>');
  html +=     formGroup('Seed', '<input type="number" id="battle-seed" value="42">');
  html +=     '<button class="btn-primary" onclick="runBattle()">Compare</button>';
  html +=   '</div>';
  html += '</div>';

  html += '<div id="battle-results"></div>';
  return html;
}

// =========================================================
// Tab: Syllabus Dossier
// =========================================================
function renderDossier(name, alg) {
  var syl = SYLLABUS[name] || { module: 'DAA', topic: alg.category };
  var html = '';

  html += '<div class="card">';
  html +=   '<div class="card-title">Syllabus Reference</div>';
  html +=   '<table style="font-size:13px;"><tbody>';
  html +=   tableRow('Module', syl.module);
  html +=   tableRow('Topic', syl.topic);
  html +=   tableRow('Technique', alg.category);
  html +=   tableRow('Complexity', '<code>' + alg.cx + '</code>');
  html +=   tableRow('Theoretical Model', alg.ab || '—');
  html +=   '</tbody></table>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="card-title">Vulnerability Analysis</div>';
  html +=   '<p style="font-size:13px;color:var(--text-sub);margin-bottom:12px;">' + alg.wk + '</p>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="card-title">Viva Preparation</div>';
  html +=   '<table style="font-size:13px;"><tbody>';
  html +=   tableRow('Q: What invariant must hold after every operation?',
                     'All invariants are verified by the <code>v()</code> predicate in algorithms.js after each timed run.');
  html +=   tableRow('Q: When does this algorithm degrade severely?', alg.wk);
  html +=   tableRow('Q: What is the complexity bound and when is it tight?', '<code>' + alg.cx + '</code>');
  html +=   '</tbody></table>';
  html += '</div>';

  return html;
}

function tableRow(label, value) {
  return '<tr>' +
    '<td style="width:220px;color:var(--text-muted);font-weight:600;padding:8px 12px 8px 0;vertical-align:top;border-bottom:1px solid var(--border);">' + label + '</td>' +
    '<td style="padding:8px 0;border-bottom:1px solid var(--border);">' + value + '</td>' +
  '</tr>';
}

// =========================================================
// Tab: Diagnostic Report
// =========================================================
function renderReport(name, alg) {
  var last = null;
  for (var i = experimentHistory.length - 1; i >= 0; i--) {
    if (experimentHistory[i].alg === name) { last = experimentHistory[i]; break; }
  }

  var reportText = last ? buildReportText(last, alg) : 'Run an experiment in the Stress Console tab to generate the diagnostic report.';

  var html = '';
  html += '<div class="card">';
  html +=   '<div class="card-title">Scientific Diagnostic Report <button class="btn-secondary btn-sm" onclick="copyReport()">Copy</button></div>';
  html +=   '<textarea id="report-text" rows="16" readonly>' + reportText + '</textarea>';
  html += '</div>';
  return html;
}

function buildReportText(r, alg) {
  return '=== DAA STRESS-TESTING REPORT ===\n' +
    '1.  Algorithm         : ' + r.alg + ' (' + alg.category + ')\n' +
    '2.  Complexity        : ' + alg.cx + '\n' +
    '3.  Workload          : n=' + r.n + ', family=' + r.family + ', seed=' + r.seed + '\n' +
    '4.  Execution Time    : ' + r.ms.toFixed(3) + ' ms  [isolated via performance.now()]\n' +
    '5.  Operations        : ' + r.ops.toLocaleString() + '\n' +
    '6.  Structural Ops    : ' + (r.st || 0).toLocaleString() + '  (Pruned: ' + (r.pr || 0) + ')\n' +
    '7.  Memory Estimate   : ' + formatBytes(r.mem) + '  [element-count model]\n' +
    '8.  Invariant Check   : ' + (r.ok ? 'PASSED' : 'FAILED') + '\n' +
    '9.  Risk Level        : ' + r.risk + '\n' +
    '10. Risk Reason       : ' + r.why + '\n' +
    '11. Vulnerability     : ' + alg.wk;
}

function copyReport() {
  var ta = $('report-text');
  if (ta && ta.value) {
    navigator.clipboard.writeText(ta.value)
      .then(function() { alert('Report copied to clipboard.'); });
  }
}

// =========================================================
// Run Single Experiment
// =========================================================
function injectPreset(family) {
  var sel = $('select-family');
  if (sel) sel.value = family;
  handleRunSingle(false);
}

function handleRunSingle(isPreview) {
  var name = currentAlgorithm;
  var alg  = A[name];
  if (!alg) return;

  var n      = parseInt($('input-size') ? $('input-size').value : alg.d[0], 10)  || alg.d[0];
  var family = $('select-family') ? $('select-family').value : alg.f[0];
  var seed   = parseInt($('input-seed') ? $('input-seed').value : '1', 10) || 1;

  if (!isPreview && n > alg.mx) {
    if (!confirm('Size ' + n + ' exceeds the recommended limit of ' + alg.mx + '. Continue?')) return;
  }

  var exec = executeSingleRun(name, n, family, seed);
  var riskResult = classifyRisk(exec.ms, exec.to, 0);
  var risk = riskResult[0];
  var why  = riskResult[1];

  // Update metrics HUD
  var hudTime   = $('hud-time');
  var hudOps    = $('hud-ops');
  var hudStruct = $('hud-struct');
  var hudMem    = $('hud-mem');

  if (hudTime)   hudTime.textContent   = exec.ms.toFixed(3) + ' ms';
  if (hudOps)    hudOps.textContent    = exec.result.ops.toLocaleString();
  if (hudStruct) hudStruct.textContent = ((exec.result.st || 0) + (exec.result.pr || 0)).toLocaleString();
  if (hudMem)    hudMem.textContent    = formatBytes(exec.result.mem);

  // Risk banner
  var bannerEl = $('risk-banner-container');
  if (bannerEl) {
    bannerEl.innerHTML =
      '<div class="risk-banner ' + risk + '">' +
        '<span class="risk-label">' + risk + ' RISK</span>' +
        '<span>' + why + '<br><small>Invariants: ' + (exec.result.ok ? 'PASS' : 'FAIL') + ' &mdash; ' + exec.result.info + '</small></span>' +
      '</div>';
  }

  // Save to history
  if (!isPreview) {
    var record = {
      id: Date.now(), time: new Date().toLocaleTimeString(),
      alg: name, n: n, family: family, seed: seed,
      ms: parseFloat(exec.ms.toFixed(3)),
      ops: exec.result.ops, st: exec.result.st || 0, pr: exec.result.pr || 0,
      mem: exec.result.mem, ok: exec.result.ok, risk: risk, why: why,
      info: exec.result.info
    };
    experimentHistory.push(record);
    localStorage.setItem('daa_history', JSON.stringify(experimentHistory));
  }

  // Results table
  var resCont = $('result-container');
  if (resCont) {
    var passHtml = exec.result.ok
      ? '<span class="pill PASS">PASS</span>'
      : '<span class="pill FAIL">FAIL</span>';
    resCont.innerHTML =
      '<div class="table-wrap"><table><thead><tr>' +
        '<th>Latency (ms)</th><th>Operations</th><th>Structural Ops</th><th>Memory (estimate)</th><th>Invariants</th><th>Risk</th>' +
      '</tr></thead><tbody><tr>' +
        '<td style="font-family:var(--font-mono);">' + exec.ms.toFixed(3) + '</td>' +
        '<td style="font-family:var(--font-mono);">' + exec.result.ops.toLocaleString() + '</td>' +
        '<td style="font-family:var(--font-mono);">' + (exec.result.st || 0).toLocaleString() + '</td>' +
        '<td style="font-family:var(--font-mono);">' + formatBytes(exec.result.mem) + '</td>' +
        '<td>' + passHtml + '</td>' +
        '<td><span class="pill ' + risk + '">' + risk + '</span></td>' +
      '</tr></tbody></table></div>' +
      '<div class="info-note">Time isolated with performance.now(). Memory is an element-count model estimate.</div>';
  }

  // Step trace
  executionSteps = [];
  currentStepIndex = 0;
  if (n <= alg.tn) {
    try {
      alg.run(exec.input, function(msg) { if (executionSteps.length < 500) executionSteps.push(msg); });
    } catch(e) {}
  } else {
    executionSteps.push({ text: 'Step visualization is only active for n <= ' + alg.tn + '.', type: 'info' });
  }
  updateStepper(exec.input);
}

// =========================================================
// Visualizer Stepper
// =========================================================
function updateStepper(input) {
  var counter  = $('step-counter');
  var explain  = $('step-explanation');
  var log      = $('step-log');

  if (!executionSteps || executionSteps.length === 0) {
    if (counter) counter.textContent = 'Step 0 / 0';
    if (explain) explain.textContent = 'No steps available. Run with smaller n.';
    if (log)     log.textContent = '';
    renderVisualStep(currentAlgorithm, null, input);
    return;
  }

  var step = executionSteps[currentStepIndex];
  if (counter) counter.textContent = 'Step ' + (currentStepIndex + 1) + ' / ' + executionSteps.length;
  if (explain) explain.textContent = step.text || ('Step ' + (currentStepIndex + 1));
  if (log) {
    log.textContent = executionSteps.slice(0, currentStepIndex + 1)
      .map(function(s, i) { return '[Step ' + (i + 1) + '] ' + s.text; }).join('\n');
    log.scrollTop = log.scrollHeight;
  }

  renderVisualStep(currentAlgorithm, step, input);
}

function getInputForStepper() {
  var alg = A[currentAlgorithm];
  var n = parseInt($('input-size') ? $('input-size').value : alg.d[0], 10) || alg.d[0];
  var family = $('select-family') ? $('select-family').value : alg.f[0];
  var seed = parseInt($('input-seed') ? $('input-seed').value : '1', 10) || 1;
  return alg.gen(n, family, seed);
}

function stepViz(delta) {
  if (!executionSteps || executionSteps.length === 0) return;
  currentStepIndex = Math.max(0, Math.min(executionSteps.length - 1, currentStepIndex + delta));
  updateStepper(getInputForStepper());
}

function restartViz() {
  currentStepIndex = 0;
  if (stepperTimer) { clearInterval(stepperTimer); stepperTimer = null; }
  var btn = $('btn-play');
  if (btn) btn.textContent = 'Play';
  updateStepper(getInputForStepper());
}

function togglePlay() {
  var btn = $('btn-play');
  if (stepperTimer) {
    clearInterval(stepperTimer);
    stepperTimer = null;
    if (btn) btn.textContent = 'Play';
  } else {
    if (!executionSteps || executionSteps.length === 0) return;
    if (btn) btn.textContent = 'Pause';
    var interval = parseInt($('stepper-speed') ? $('stepper-speed').value : 300, 10) || 300;
    stepperTimer = setInterval(function() {
      if (currentStepIndex >= executionSteps.length - 1) {
        clearInterval(stepperTimer); stepperTimer = null;
        if (btn) btn.textContent = 'Play';
      } else {
        stepViz(1);
      }
    }, interval);
  }
}

// =========================================================
// Benchmark Suite
// =========================================================
async function handleBenchmark() {
  var name = currentAlgorithm;
  var alg  = A[name];
  if (!alg) return;

  var startN = parseInt($('bm-start').value, 10) || alg.d[1];
  var endN   = parseInt($('bm-end').value,   10) || alg.d[2];
  var stepN  = parseInt($('bm-step').value,  10) || alg.d[3];
  var runs   = parseInt($('bm-runs').value,  10) || 3;
  var family = $('select-family') ? $('select-family').value : alg.f[0];
  var prog   = $('bm-progress');

  benchmarkCancel = false;
  if (prog) prog.value = 0;

  var results = await runBenchmarkSuite(
    name, startN, endN, stepN, family, runs,
    function(p) { if (prog) prog.value = p; },
    function()  { return benchmarkCancel; }
  );

  renderBenchmarkChart('bm-chart', results);
  renderBenchmarkDataTable(results);
}

function renderBenchmarkDataTable(results) {
  var cont = $('bm-table-container');
  if (!cont) return;

  var html = '<div class="table-wrap"><table><thead><tr>' +
    '<th>Size (n)</th><th>Time Median (ms)</th><th>Operations</th><th>Theory Model</th><th>Ratio (Ops/Theory)</th><th>Memory</th><th>Risk</th>' +
  '</tr></thead><tbody>';

  results.forEach(function(r) {
    html += '<tr>' +
      '<td style="font-family:var(--font-mono);">' + r.n + '</td>' +
      '<td style="font-family:var(--font-mono);">' + r.timeMedian.toFixed(3) + '</td>' +
      '<td style="font-family:var(--font-mono);">' + r.ops.toLocaleString() + '</td>' +
      '<td style="font-family:var(--font-mono);">' + r.th.toLocaleString() + '</td>' +
      '<td style="font-family:var(--font-mono);">' + (r.ratio ? r.ratio.toFixed(3) : '—') + '</td>' +
      '<td style="font-family:var(--font-mono);">' + formatBytes(r.mem) + '</td>' +
      '<td><span class="pill ' + r.risk + '">' + r.risk + '</span></td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';
  cont.innerHTML = html;
}

// =========================================================
// Battle Comparison
// =========================================================
function runBattle() {
  var cont = $('battle-results');
  if (!cont) return;

  var name = currentAlgorithm;
  var alg  = A[name];
  if (!alg || !alg.pr) return;

  var pName = alg.pr;
  var pAlg  = A[pName];

  var n      = parseInt($('battle-size') ? $('battle-size').value : alg.d[0], 10) || alg.d[0];
  var family = $('battle-family') ? $('battle-family').value : alg.f[0];
  var seed   = parseInt($('battle-seed') ? $('battle-seed').value : 42, 10) || 42;

  var execA = executeSingleRun(name,  n, family, seed);
  var famB  = pAlg.f.includes(family) ? family : pAlg.f[0];
  var execB = executeSingleRun(pName, n, famB,   seed);

  cont.innerHTML =
    '<div class="battle-cards">' +
      battleCard(name,  alg,  execA) +
      battleCard(pName, pAlg, execB) +
    '</div>' +
    '<div class="card">' +
      '<div class="card-title">Academic Analysis</div>' +
      '<p style="font-size:13px;color:var(--text-sub);line-height:1.6;">' + getBattleAnalysis(name) + '</p>' +
    '</div>';
}

function battleCard(name, alg, exec) {
  var risk = classifyRisk(exec.ms, exec.to, 0);
  return '<div class="battle-card">' +
    '<div class="battle-card-title">' + name + '</div>' +
    '<div class="metric-row-item"><span>Time</span><span>' + exec.ms.toFixed(3) + ' ms</span></div>' +
    '<div class="metric-row-item"><span>Operations</span><span>' + exec.result.ops.toLocaleString() + '</span></div>' +
    '<div class="metric-row-item"><span>Structural Ops</span><span>' + (exec.result.st || 0).toLocaleString() + '</span></div>' +
    '<div class="metric-row-item"><span>Memory</span><span>' + formatBytes(exec.result.mem) + '</span></div>' +
    '<div class="metric-row-item"><span>Complexity</span><span>' + alg.cx.split('|')[0].trim() + '</span></div>' +
    '<div class="metric-row-item"><span>Risk</span><span><span class="pill ' + risk[0] + '">' + risk[0] + '</span></span></div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">' + exec.result.info + '</div>' +
  '</div>';
}

function getBattleAnalysis(name) {
  if (name === 'Prim' || name === 'Kruskal') {
    return 'Prim\'s algorithm uses a min-heap on vertices O(E log V) and is better on dense graphs. Kruskal sorts all edges O(E log E) and uses a Union-Find data structure, performing better on sparse graphs. Both must produce an identical MST weight on the same graph.';
  }
  if (name.includes('Knapsack')) {
    return 'Fractional Knapsack is solved greedily in O(n log n) because item divisibility guarantees the greedy-choice property. The 0/1 variant requires DP O(nC) because items cannot be split. On adversarial inputs (capacity=10, items=(6,12),(5,9),(5,9)), fractional gives 19.2 while the greedy 0/1 approach gives only 12 vs the DP optimum of 18.';
  }
  if (name.includes('Heap')) {
    return 'Binomial Heaps maintain an eager binary-counter tree collection with O(log n) union. Fibonacci Heaps use lazy amortized consolidation, achieving O(1) amortized insert and decrease-key — critical for improving Dijkstra\'s and Prim\'s algorithm to O(E + V log V).';
  }
  return 'Both algorithms solve the same problem class. Compare timing, operation count, and memory to observe practical engineering trade-offs.';
}

// =========================================================
// View: Complexity Matrix
// =========================================================
function renderComplexityPage(main) {
  var html = '';
  html += '<div class="page-header">';
  html +=   '<div class="breadcrumb">DAA Laboratory / Complexity Matrix</div>';
  html +=   '<h1>Complexity Classification &amp; P vs NP</h1>';
  html +=   '<p>Formal distinction between Decision (NP, NP-complete) and Optimization/Search (NP-hard, in P) problems.</p>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="table-wrap"><table><thead><tr>';
  html +=   '<th>Problem</th><th>Decision Form</th><th>Optimization Form</th><th>Status</th><th>Explanation</th>';
  html +=   '</tr></thead><tbody>';

  COMPLEXITY_TABLE.forEach(function(row) {
    html += '<tr>' +
      '<td><strong>' + row.problem + '</strong></td>' +
      '<td style="font-size:12px;">' + row.decision + '</td>' +
      '<td style="font-size:12px;">' + row.optimization + '</td>' +
      '<td><span class="tag">' + row.status + '</span></td>' +
      '<td style="font-size:12px;color:var(--text-sub);">' + row.note + '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';
  html += '</div>';
  main.innerHTML = html;
}

// =========================================================
// View: Experiment History
// =========================================================
function renderHistoryPage(main) {
  var html = '';
  html += '<div class="page-header">';
  html +=   '<div class="breadcrumb">DAA Laboratory / Experiment Log</div>';
  html +=   '<h1>Experiment Telemetry Log</h1>';
  html +=   '<p>All recorded stress-test runs. Persisted in localStorage.</p>';
  html += '</div>';

  html += '<div class="card">';
  html +=   '<div class="form-row" style="margin-bottom:12px;">';
  html +=     '<button class="btn-secondary" onclick="exportCSV()">Export CSV</button>';
  html +=     '<button class="btn-secondary" onclick="exportJSON()">Export JSON</button>';
  html +=     '<button class="btn-danger" onclick="clearHistory()" style="margin-left:auto;">Clear Log</button>';
  html +=   '</div>';

  if (experimentHistory.length === 0) {
    html += '<div class="empty-state">No experiments recorded yet. Run an experiment from any algorithm page.</div>';
  } else {
    html += '<div class="table-wrap"><table><thead><tr>' +
      '<th>Time</th><th>Algorithm</th><th>n</th><th>Family</th><th>Time (ms)</th><th>Operations</th><th>Memory</th><th>Invariants</th><th>Risk</th>' +
    '</tr></thead><tbody>';

    var rev = experimentHistory.slice().reverse();
    rev.forEach(function(r) {
      html += '<tr>' +
        '<td style="font-family:var(--font-mono);font-size:12px;">' + r.time + '</td>' +
        '<td><strong>' + r.alg + '</strong></td>' +
        '<td style="font-family:var(--font-mono);">' + r.n + '</td>' +
        '<td><span class="tag">' + r.family + '</span></td>' +
        '<td style="font-family:var(--font-mono);">' + r.ms.toFixed(3) + '</td>' +
        '<td style="font-family:var(--font-mono);">' + r.ops.toLocaleString() + '</td>' +
        '<td style="font-family:var(--font-mono);">' + formatBytes(r.mem) + '</td>' +
        '<td><span class="pill ' + (r.ok ? 'PASS' : 'FAIL') + '">' + (r.ok ? 'PASS' : 'FAIL') + '</span></td>' +
        '<td><span class="pill ' + r.risk + '">' + r.risk + '</span></td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
  }

  html += '</div>';
  main.innerHTML = html;
}

function clearHistory() {
  if (confirm('Clear all experiment records?')) {
    experimentHistory = [];
    localStorage.removeItem('daa_history');
    navigate('history');
  }
}

function exportCSV() {
  if (!experimentHistory.length) { alert('No records to export.'); return; }
  var headers = ['id','time','alg','n','family','seed','ms','ops','st','pr','mem','ok','risk','why'];
  var rows = experimentHistory.map(function(r) {
    return headers.map(function(h) { return JSON.stringify(r[h] !== undefined ? r[h] : ''); }).join(',');
  });
  downloadFile('daa_experiments.csv', [headers.join(',')].concat(rows).join('\n'), 'text/csv');
}

function exportJSON() {
  if (!experimentHistory.length) { alert('No records to export.'); return; }
  downloadFile('daa_experiments.json', JSON.stringify(experimentHistory, null, 2), 'application/json');
}

function downloadFile(name, content, type) {
  var blob = new Blob([content], { type: type });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// =========================================================
// View: Acceptance Tests
// =========================================================
function renderTestsPage(main) {
  main.innerHTML =
    '<div class="page-header">' +
      '<div class="breadcrumb">DAA Laboratory / Acceptance Tests</div>' +
      '<h1>Automated Acceptance Test Suite</h1>' +
      '<p>10 mathematical correctness checks that verify algorithm invariants and expected output values.</p>' +
    '</div>' +
    '<div class="card">' +
      '<div class="form-row" style="margin-bottom:12px;">' +
        '<button class="btn-primary" onclick="runTests()">Run All 10 Tests</button>' +
        '<progress id="test-progress" value="0" max="1" style="align-self:center;"></progress>' +
        '<span id="test-badge" style="font-weight:700;font-size:14px;"></span>' +
      '</div>' +
      '<div id="test-results"><div class="empty-state">Click Run All 10 Tests to verify algorithm correctness.</div></div>' +
    '</div>';
}

async function runTests() {
  var cont  = $('test-results');
  var prog  = $('test-progress');
  var badge = $('test-badge');
  if (!cont) return;

  cont.innerHTML = '<div class="empty-state">Running tests&hellip;</div>';

  var results = await runAcceptanceTests(function(pct) {
    if (prog) prog.value = pct;
  });

  var passed = results.filter(function(r) { return r.pass; }).length;
  if (badge) {
    badge.style.color = passed === results.length ? 'var(--ok-text)' : 'var(--bad-text)';
    badge.textContent = passed + ' / ' + results.length + ' PASSED';
  }

  var html = '<div class="table-wrap"><table><thead><tr><th>Status</th><th>Test</th><th>Details</th></tr></thead><tbody>';

  results.forEach(function(r) {
    var cls = r.pass ? 'PASS' : 'FAIL';
    html += '<tr>' +
      '<td><span class="pill ' + cls + '">' + cls + '</span></td>' +
      '<td><strong>' + r.name + '</strong></td>' +
      '<td style="font-family:var(--font-mono);font-size:12px;">' + r.details + '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div>';
  cont.innerHTML = html;
}

// =========================================================
// App Bootstrap
// =========================================================
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initApp);
}
