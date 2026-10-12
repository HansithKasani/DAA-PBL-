// Mulberry32: Fast, high-quality, reproducible 32-bit seeded PRNG
function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Data Structure Key Generators (Binomial Heap, Fibonacci Heap, B-Tree, Red-Black Tree)
function genKeys(n, family, seed) {
  const rng = mulberry32(seed || 1);
  n = Math.max(1, Math.floor(n));
  let arr = [];
  
  if (family === 'ascending') {
    for (let i = 1; i <= n; i++) arr.push(i * 2);
    return { K: arr, seed: seed || 1, family, n };
  }
  
  if (family === 'descending') {
    for (let i = n; i >= 1; i--) arr.push(i * 2);
    return { K: arr, seed: seed || 1, family, n };
  }
  
  if (family === 'duplicates') {
    const distinct = Math.max(2, Math.floor(n / 10));
    for (let i = 0; i < n; i++) {
      arr.push(1 + Math.floor(rng() * distinct));
    }
    return { K: arr, seed: seed || 1, family, n };
  }
  
  // Default: random uniform keys
  for (let i = 0; i < n; i++) {
    arr.push(1 + Math.floor(rng() * (n * 10)));
  }
  return { K: arr, seed: seed || 1, family, n };
}

// Graph Generator for MST (Prim & Kruskal) - Guarantees connectivity and identical graph for same seed
function genGraph(V, family, seed) {
  V = Math.max(2, Math.floor(V));
  const rng = mulberry32(seed || 1);
  const maxEdges = Math.floor((V * (V - 1)) / 2);
  
  let targetEdges;
  if (family === 'sparse') {
    targetEdges = Math.min(maxEdges, Math.max(V - 1, 2 * V));
  } else if (family === 'medium') {
    targetEdges = Math.min(maxEdges, Math.max(V - 1, Math.floor(Math.pow(V, 1.5))));
  } else {
    // Dense: ~80% of max edges
    targetEdges = Math.min(maxEdges, Math.max(V - 1, Math.floor(maxEdges * 0.8)));
  }
  
  const edges = [];
  const edgeSet = new Set();
  
  function addEdge(u, v, weight) {
    if (u === v) return false;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    edges.push([u, v, weight]);
    return true;
  }
  
  // Guarantee connected tree backbone first
  for (let i = 1; i < V; i++) {
    const parent = Math.floor(rng() * i);
    const weight = 1 + Math.floor(rng() * 100);
    addEdge(parent, i, weight);
  }
  
  // Add random remaining edges up to target count
  let attempts = 0;
  while (edges.length < targetEdges && attempts < targetEdges * 10) {
    attempts++;
    const u = Math.floor(rng() * V);
    const v = Math.floor(rng() * V);
    const weight = 1 + Math.floor(rng() * 100);
    addEdge(u, v, weight);
  }
  
  // Build adjacency list for Prim
  const adj = Array.from({ length: V }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  
  return { V, E: edges, adj, seed: seed || 1, family };
}

// Knapsack Generator (Fractional & 0/1 Knapsack)
function genKnapsack(n, family, seed) {
  n = Math.max(1, Math.floor(n));
  const rng = mulberry32(seed || 1);
  
  if (family === 'adversarial') {
    // Exact classic greedy-failure benchmark:
    // Capacity = 10, items: (w=6, v=12), (w=5, v=9), (w=5, v=9)
    // Fractional: item 0 (12) + 4/5 of item 1 (7.2) = 19.2
    // 0/1 DP Optimal: item 1 + item 2 = 9 + 9 = 18 (weight 10)
    // Greedy-by-ratio 0/1: item 0 = 12 (weight 6, remaining 4 cannot fit 5)
    const weights = [6, 5, 5];
    const values = [12, 9, 9];
    // Fill remaining dummy items with weight > capacity if n > 3
    for (let i = 3; i < n; i++) {
      weights.push(11 + (i % 5));
      values.push(1 + Math.floor(rng() * 3));
    }
    return { w: weights, v: values, C: 10, family, seed: seed || 1, n };
  }
  
  const weights = [];
  const values = [];
  for (let i = 0; i < n; i++) {
    const w = 1 + Math.floor(rng() * 50);
    const v = 1 + Math.floor(rng() * 100);
    weights.push(w);
    values.push(v);
  }
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let capacity;
  if (family === 'capacity') {
    // Capacity stress: 10% of total weight
    capacity = Math.max(1, Math.floor(totalWeight * 0.10));
  } else {
    // Random / 50% capacity
    capacity = Math.max(1, Math.floor(totalWeight * 0.50));
  }
  
  return { w: weights, v: values, C: capacity, family, seed: seed || 1, n };
}

// Floyd-Warshall Matrix Generator
function genFloydWarshall(V, family, seed) {
  V = Math.max(2, Math.floor(V));
  const rng = mulberry32(seed || 1);
  const INF = 1e9;
  
  let p = 0.5;
  if (family === 'sparse') p = 0.15;
  else if (family === 'dense') p = 0.90;
  
  const dist = Array.from({ length: V }, (_, i) =>
    Array.from({ length: V }, (_, j) => {
      if (i === j) return 0;
      if (rng() < p) {
        return 1 + Math.floor(rng() * 50);
      }
      return INF;
    })
  );
  
  return { V, d: dist, family, seed: seed || 1 };
}

// Matrix Chain Dimensions Generator
function genMatrixChain(n, family, seed) {
  n = Math.max(2, Math.floor(n));
  const rng = mulberry32(seed || 1);
  let D = [];
  
  for (let i = 0; i <= n; i++) {
    D.push(5 + Math.floor(rng() * 95));
  }
  
  if (family === 'increasing') {
    D.sort((a, b) => a - b);
  } else if (family === 'decreasing') {
    D.sort((a, b) => b - a);
  }
  
  return { D, n, family, seed: seed || 1 };
}

// N-Queens Generator
function genNQueens(n, family) {
  n = Math.max(4, Math.floor(n));
  return { n, all: family === 'all', family };
}

// Hamiltonian Cycle Graph Generator
function genHamiltonian(n, family, seed) {
  n = Math.max(3, Math.floor(n));
  const rng = mulberry32(seed || 1);
  const adj = Array.from({ length: n }, () => Array(n).fill(0));
  
  if (family === 'pathological') {
    // Clique K_{n-1} on vertices 0..n-2 plus vertex n-1 connected ONLY to vertex 0
    // Degree of vertex n-1 is 1 -> impossible to form a Hamiltonian cycle (needs degree >= 2)
    // Forces exhaustive search of the entire factorial state space
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n - 1; j++) {
        adj[i][j] = adj[j][i] = 1;
      }
    }
    // Single bridge edge between 0 and n-1
    adj[0][n - 1] = adj[n - 1][0] = 1;
    return { n, a: adj, family, seed: seed || 1 };
  }
  
  let p = 0.5;
  if (family === 'sparse') p = 0.30;
  else if (family === 'dense') p = 0.80;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rng() < p) {
        adj[i][j] = adj[j][i] = 1;
      }
    }
  }
  
  return { n, a: adj, family, seed: seed || 1 };
}

// TSP Distance Matrix Generator
function genTSP(n, family, seed) {
  n = Math.max(3, Math.floor(n));
  const rng = mulberry32(seed || 1);
  
  const points = Array.from({ length: n }, () => [
    Math.floor(rng() * 100),
    Math.floor(rng() * 100)
  ]);
  
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      if (family === 'euclidean') {
        const dx = points[i][0] - points[j][0];
        const dy = points[i][1] - points[j][1];
        return Math.round(Math.hypot(dx, dy)) + 1;
      } else {
        // Random symmetric distance
        return 1 + Math.floor(rng() * 100);
      }
    })
  );
  
  // Ensure symmetry for random symmetric family
  if (family !== 'euclidean') {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        dist[i][j] = dist[j][i];
      }
    }
  }
  
  return { n, d: dist, points, family, seed: seed || 1 };
}

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, {
    mulberry32,
    genKeys,
    genGraph,
    genKnapsack,
    genFloydWarshall,
    genMatrixChain,
    genNQueens,
    genHamiltonian,
    genTSP
  });
}
