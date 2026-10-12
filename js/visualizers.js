// Visualizer Dispatcher and Custom Canvas Renderers with Dual Theme (Light Default & Dark) Support

function isDarkMode() {
  return typeof document !== 'undefined' && document.body && document.body.dataset.theme === 'dark';
}

function renderVisualStep(algName, stepData, inputData) {
  const container = document.getElementById('visual-canvas');
  if (!container) return;

  if (!stepData) {
    container.innerHTML = '<div style="color:var(--text-muted);font-style:italic;font-size:12px;">No visual state available for this step.</div>';
    return;
  }

  // 1. N-Queens Visualizer
  if (algName === 'N-Queens') {
    renderNQueensBoard(container, stepData, inputData);
    return;
  }

  // 2. TSP 2D Map Visualizer
  if (algName === 'TSP') {
    renderTSPMap(container, stepData, inputData);
    return;
  }

  // 3. MST (Prim & Kruskal) Visualizer
  if (algName === 'Prim' || algName === 'Kruskal') {
    renderMSTGraph(container, stepData, inputData);
    return;
  }

  // 4. Hamiltonian Cycle Visualizer
  if (algName === 'Hamiltonian') {
    renderHamiltonianGraph(container, stepData, inputData);
    return;
  }

  // 5. Floyd-Warshall Distance Matrix Visualizer
  if (algName === 'Floyd-Warshall') {
    renderFloydWarshallMatrix(container, stepData, inputData);
    return;
  }

  // 6. 0/1 Knapsack DP Visualizer
  if (algName === '0/1 Knapsack' || algName === 'Fractional Knapsack') {
    renderKnapsackVisual(container, stepData, inputData);
    return;
  }

  // 7. Matrix Chain Visualizer
  if (algName === 'Matrix Chain') {
    renderMatrixChainVisual(container, stepData, inputData);
    return;
  }

  // 8. Trees & Heaps Generic Visualizer
  renderTreeStructureVisual(container, algName, stepData, inputData);
}

// -------------------------------------------------------------
// 1. N-Queens Chessboard Renderer
// -------------------------------------------------------------
function renderNQueensBoard(container, step, input) {
  const n = input.n;
  const queens = step.queens || [];
  const dark = isDarkMode();
  
  const boardBorder = dark ? '#334155' : '#cbd5e1';
  const cellBorder = dark ? '#1f2937' : '#e2e8f0';

  let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">`;
  html += `<div style="display:grid;grid-template-columns:repeat(${n}, 34px);border:1px solid ${boardBorder};border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">`;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isDarkCell = (r + c) % 2 === 1;
      const isQueen = queens[r] === c;
      const isCurrent = step.row === r && step.col === c;
      
      let bg = isDarkCell ? (dark ? '#1e293b' : '#f1f5f9') : (dark ? '#111827' : '#ffffff');
      let textColor = dark ? '#f8fafc' : '#0f172a';
      
      if (isCurrent && step.type === 'place') {
        bg = dark ? '#064e3b' : '#dcfce7';
        textColor = dark ? '#4ade80' : '#166534';
      }
      if (isCurrent && (step.type === 'prune' || step.type === 'backtrack')) {
        bg = dark ? '#7f1d1d' : '#fee2e2';
        textColor = dark ? '#fca5a5' : '#991b1b';
      }

      html += `<div style="width:34px;height:34px;background:${bg};display:grid;place-items:center;font-size:15px;font-weight:700;font-family:var(--font-mono);color:${textColor};border:0.5px solid ${cellBorder};user-select:none;">`;
      if (isQueen) {
        html += `Q`;
      }
      html += `</div>`;
    }
  }

  html += `</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Board Dimension: ${n} x ${n} | Placed Queens: ${queens.length}</div></div>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// 2. TSP 2D Map Canvas Renderer
// -------------------------------------------------------------
function renderTSPMap(container, step, input) {
  const n = input.n;
  const points = input.points || [];
  const tour = step.tour || [];
  const dark = isDarkMode();
  
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = dark ? '#111827' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pad = 28;
  const w = canvas.width - 2 * pad;
  const h = canvas.height - 2 * pad;

  // Scale coordinates
  const coords = points.map(p => ({
    x: pad + (p[0] / 100) * w,
    y: pad + (p[1] / 100) * h
  }));

  // Grid background
  ctx.strokeStyle = dark ? '#1e293b' : '#f1f5f9';
  ctx.lineWidth = 1;
  for (let x = pad; x <= canvas.width - pad; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, canvas.height - pad);
    ctx.stroke();
  }
  for (let y = pad; y <= canvas.height - pad; y += 40) {
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(canvas.width - pad, y);
    ctx.stroke();
  }

  // Draw tour edges
  if (tour.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = step.type === 'newBest' ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#38bdf8' : '#2563eb');
    ctx.lineWidth = 2;
    ctx.setLineDash(step.type === 'explore' ? [4, 3] : []);
    
    for (let i = 0; i < tour.length; i++) {
      const u = tour[i];
      const p = coords[u];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw City Nodes
  coords.forEach((p, i) => {
    const isStart = i === 0;
    const inTour = tour.includes(i);
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = isStart ? (dark ? '#f8fafc' : '#0f172a') : inTour ? (dark ? '#475569' : '#334155') : (dark ? '#1e293b' : '#ffffff');
    ctx.fill();
    ctx.strokeStyle = dark ? '#94a3b8' : '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = (isStart || inTour) ? (dark ? '#090d16' : '#ffffff') : (dark ? '#f8fafc' : '#0f172a');
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i, p.x, p.y);
  });

  container.innerHTML = '';
  container.appendChild(canvas);
}

// -------------------------------------------------------------
// 3. MST (Prim & Kruskal) Graph Canvas Renderer
// -------------------------------------------------------------
function renderMSTGraph(container, step, input) {
  const V = input.V;
  const edges = input.E;
  const activeEdge = step.edge;
  const dark = isDarkMode();
  
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = dark ? '#111827' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 80;

  // Position vertices in a circle
  const nodePos = [];
  for (let i = 0; i < V; i++) {
    const angle = (2 * Math.PI * i) / V - Math.PI / 2;
    nodePos.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  }

  // Draw regular edges
  edges.forEach(([u, v, w]) => {
    ctx.beginPath();
    ctx.strokeStyle = dark ? '#1f293d' : '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.moveTo(nodePos[u].x, nodePos[u].y);
    ctx.lineTo(nodePos[v].x, nodePos[v].y);
    ctx.stroke();
  });

  // Highlight active edge
  if (activeEdge) {
    const [u, v, w] = activeEdge;
    ctx.beginPath();
    ctx.strokeStyle = step.type === 'accept' ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#f87171' : '#dc2626');
    ctx.lineWidth = 2.5;
    ctx.moveTo(nodePos[u].x, nodePos[u].y);
    ctx.lineTo(nodePos[v].x, nodePos[v].y);
    ctx.stroke();

    // Edge weight label
    const midX = (nodePos[u].x + nodePos[v].x) / 2;
    const midY = (nodePos[u].y + nodePos[v].y) / 2;
    ctx.fillStyle = dark ? '#1e293b' : '#ffffff';
    ctx.fillRect(midX - 12, midY - 7, 24, 14);
    ctx.strokeStyle = dark ? '#334155' : '#cbd5e1';
    ctx.strokeRect(midX - 12, midY - 7, 24, 14);
    ctx.fillStyle = dark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${w}`, midX, midY);
  }

  // Draw Vertices
  nodePos.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = dark ? '#1e293b' : '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = dark ? '#94a3b8' : '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = dark ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i, p.x, p.y);
  });

  container.innerHTML = '';
  container.appendChild(canvas);
}

// -------------------------------------------------------------
// 4. Hamiltonian Cycle Graph Renderer
// -------------------------------------------------------------
function renderHamiltonianGraph(container, step, input) {
  const n = input.n;
  const adj = input.a;
  const path = step.path || [];
  const dark = isDarkMode();

  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = dark ? '#111827' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 78;

  const nodePos = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodePos.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  }

  // Draw all adjacency edges
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (adj[i][j] === 1) {
        ctx.beginPath();
        ctx.strokeStyle = dark ? '#1f293d' : '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.moveTo(nodePos[i].x, nodePos[i].y);
        ctx.lineTo(nodePos[j].x, nodePos[j].y);
        ctx.stroke();
      }
    }
  }

  // Draw active traversed path
  if (path.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = step.type === 'cycleFound' ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#38bdf8' : '#2563eb');
    ctx.lineWidth = 2.2;
    for (let i = 0; i < path.length; i++) {
      const p = nodePos[path[i]];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // Draw nodes
  nodePos.forEach((p, i) => {
    const inPath = path.includes(i);
    const isStart = i === 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = isStart ? (dark ? '#f8fafc' : '#0f172a') : inPath ? (dark ? '#475569' : '#334155') : (dark ? '#1e293b' : '#ffffff');
    ctx.fill();
    ctx.strokeStyle = dark ? '#94a3b8' : '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = (isStart || inPath) ? (dark ? '#090d16' : '#ffffff') : (dark ? '#f8fafc' : '#0f172a');
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i, p.x, p.y);
  });

  container.innerHTML = '';
  container.appendChild(canvas);
}

// -------------------------------------------------------------
// 5. Floyd-Warshall Distance Matrix Visualizer
// -------------------------------------------------------------
function renderFloydWarshallMatrix(container, step, input) {
  const V = input.V;
  const dist = input.d;
  const dark = isDarkMode();

  const border = dark ? '#1f293d' : '#e2e8f0';
  const thBg = dark ? '#141d2e' : '#f8fafc';

  let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">`;
  html += `<div style="font-weight:600;font-size:11.5px;color:var(--text-secondary);">Distance Matrix (${V} x ${V})</div>`;
  html += `<table style="border-collapse:collapse;font-family:var(--font-mono);font-size:11px;text-align:center;">`;
  
  html += `<tr><th style="padding:3px 6px;color:var(--text-muted);background:${thBg};border:1px solid ${border};">i\\j</th>`;
  for (let j = 0; j < V; j++) {
    html += `<th style="padding:3px 6px;color:var(--text-secondary);background:${thBg};border:1px solid ${border};">${j}</th>`;
  }
  html += `</tr>`;

  for (let i = 0; i < V; i++) {
    html += `<tr><td style="font-weight:600;color:var(--text-secondary);padding:3px 6px;background:${thBg};border:1px solid ${border};">${i}</td>`;
    for (let j = 0; j < V; j++) {
      const val = dist[i][j];
      const isUpdated = step.i === i && step.j === j;
      const isIntermediate = step.k === i || step.k === j;
      
      let bg = dark ? '#111827' : '#ffffff';
      let col = dark ? '#f8fafc' : '#0f172a';
      if (isUpdated) {
        bg = dark ? '#064e3b' : '#dcfce7';
        col = dark ? '#4ade80' : '#166534';
      } else if (isIntermediate) {
        bg = dark ? '#1a2234' : '#f1f5f9';
      }

      html += `<td style="padding:3px 6px;background:${bg};color:${col};border:1px solid ${border};">${val >= 1e9 ? 'INF' : val}</td>`;
    }
    html += `</tr>`;
  }

  html += `</table></div>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// 6. Knapsack Item & Ratio Visualizer
// -------------------------------------------------------------
function renderKnapsackVisual(container, step, input) {
  const { w, v, C } = input;
  const n = w.length;
  const dark = isDarkMode();

  const cardBg = dark ? '#111827' : '#ffffff';
  const border = dark ? '#1f293d' : '#e2e8f0';

  let html = `<div style="width:100%;display:flex;flex-direction:column;gap:8px;">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px;">`;
  html += `<span style="font-weight:600;font-size:12px;color:var(--text-main);">Capacity Constraint: ${C}</span>`;
  html += `<span style="font-size:11px;color:var(--text-muted);">Items: ${n}</span></div>`;

  html += `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">`;
  for (let i = 0; i < Math.min(n, 12); i++) {
    const ratio = (v[i] / w[i]).toFixed(2);
    const isAdversarial = input.family === 'adversarial' && i < 3;
    
    html += `<div style="background:${cardBg};border:1px solid ${border};border-radius:6px;padding:6px 10px;display:flex;flex-direction:column;align-items:center;min-width:80px;">`;
    html += `<div style="font-weight:600;font-size:11.5px;color:var(--text-main);">Item ${i}</div>`;
    html += `<div style="font-size:11px;color:var(--text-secondary);">W: <b>${w[i]}</b> | V: <b>${v[i]}</b></div>`;
    html += `<div style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);margin-top:1px;">v/w = ${ratio}</div>`;
    if (isAdversarial) {
      html += `<span style="font-size:9px;background:var(--warning-bg);color:var(--warning-text);border:1px solid var(--warning-border);padding:1px 4px;border-radius:3px;margin-top:2px;">Adversarial</span>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// 7. Matrix Chain Visualizer
// -------------------------------------------------------------
function renderMatrixChainVisual(container, step, input) {
  const D = input.D;
  const n = D.length - 1;
  const dark = isDarkMode();
  const cardBg = dark ? '#111827' : '#ffffff';
  const border = dark ? '#1f293d' : '#e2e8f0';

  let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;">`;
  html += `<div style="font-weight:600;font-size:12px;color:var(--text-main);">Chain Dimension Sequence: [${D.join(' x ')}]</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">`;

  for (let i = 1; i <= n; i++) {
    html += `<div style="background:${cardBg};border:1px solid ${border};border-radius:6px;padding:6px 12px;text-align:center;">`;
    html += `<div style="font-weight:600;color:var(--text-main);font-size:12px;">Matrix A${i}</div>`;
    html += `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-top:1px;">${D[i - 1]} x ${D[i]}</div>`;
    html += `</div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// -------------------------------------------------------------
// 8. Trees & Heaps Generic Structure Visualizer
// -------------------------------------------------------------
function renderTreeStructureVisual(container, algName, step, input) {
  const dark = isDarkMode();
  const cardBg = dark ? '#111827' : '#ffffff';
  const border = dark ? '#1f293d' : '#e2e8f0';

  let html = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">`;
  html += `<div style="font-weight:600;color:var(--text-main);font-size:12.5px;">${algName} Structural State</div>`;
  
  if (step.rootKeys) {
    html += `<div style="background:${cardBg};border:1px solid ${border};padding:8px 14px;border-radius:6px;font-family:var(--font-mono);font-size:12px;">`;
    html += `Root Node Keys: [ <b style="color:var(--primary);">${step.rootKeys.join(', ')}</b> ]`;
    html += `</div>`;
  } else {
    html += `<div style="color:var(--text-secondary);font-size:11.5px;max-width:440px;line-height:1.5;">${step.text || 'Processing data structure workload...'}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}
