// Built-in Acceptance Test Suite for Live Verification

async function runAcceptanceTests(onProgress) {
  const tests = [
    {
      id: 'fw_ops',
      name: 'Floyd-Warshall Loop Counting (V=10 -> 1,000 ops, V=20 -> 8,000 ops)',
      run: () => {
        const res10 = executeSingleRun('Floyd-Warshall', 10, 'random', 42);
        const res20 = executeSingleRun('Floyd-Warshall', 20, 'random', 42);
        const pass = res10.result.ops === 1000 && res20.result.ops === 8000;
        return {
          pass,
          details: `V=10: ops = ${res10.result.ops} (expected 1,000) | V=20: ops = ${res20.result.ops} (expected 8,000)`
        };
      }
    },
    {
      id: 'mcm_ops',
      name: 'Matrix Chain Inner Ops Formula (n=10 -> (1000-10)/6 = 165 ops)',
      run: () => {
        const res = executeSingleRun('Matrix Chain', 10, 'random', 42);
        const expected = (1000 - 10) / 6;
        const pass = res.result.ops === expected;
        return {
          pass,
          details: `n=10: ops = ${res.result.ops} (expected ${expected})`
        };
      }
    },
    {
      id: 'mst_match',
      name: 'Prim vs Kruskal MST Cost & Edge Equality on Identical Graph',
      run: () => {
        const V = 30;
        const seed = 999;
        const graph = genGraph(V, 'medium', seed);
        const primRes = A['Prim'].run(graph, null);
        const kruRes = A['Kruskal'].run(graph, null);
        const pass = primRes.cost === kruRes.cost && primRes.edges.length === V - 1 && kruRes.edges.length === V - 1;
        return {
          pass,
          details: `Prim Cost: ${primRes.cost} (${primRes.edges.length} edges) | Kruskal Cost: ${kruRes.cost} (${kruRes.edges.length} edges)`
        };
      }
    },
    {
      id: 'adv_knapsack',
      name: 'Adversarial Knapsack Gap (Fractional=19.2, 0/1 DP=18, Greedy=12)',
      run: () => {
        const input = genKnapsack(3, 'adversarial', 1);
        const fracRes = A['Fractional Knapsack'].run(input, null);
        const dpRes = A['0/1 Knapsack'].run(input, null);
        // Greedy 0/1 computation on this instance
        const greedyVal = (function () {
          const order = [0, 1, 2].sort((a, b) => input.v[b] / input.w[b] - input.v[a] / input.w[a]);
          let c = input.C, v = 0;
          for (const i of order) {
            if (input.w[i] <= c) { c -= input.w[i]; v += input.v[i]; }
          }
          return v;
        })();

        const fracPass = Math.abs(fracRes.val - 19.2) < 1e-4;
        const dpPass = dpRes.val === 18;
        const greedyPass = greedyVal === 12;
        const pass = fracPass && dpPass && greedyPass;

        return {
          pass,
          details: `Fractional Val: ${fracRes.val.toFixed(1)} (exp 19.2) | 0/1 DP Optimal: ${dpRes.val} (exp 18) | Greedy 0/1: ${greedyVal} (exp 12)`
        };
      }
    },
    {
      id: 'nq_counts',
      name: 'N-Queens All Solutions Exact Counts (n=6 -> 4, n=8 -> 92)',
      run: () => {
        const res6 = executeSingleRun('N-Queens', 6, 'all', 1);
        const res8 = executeSingleRun('N-Queens', 8, 'all', 1);
        const match6 = res6.result.info.includes('Solutions found: 4');
        const match8 = res8.result.info.includes('Solutions found: 92');
        const pass = match6 && match8 && res6.result.ok && res8.result.ok;
        return {
          pass,
          details: `n=6 solutions: ${match6 ? 4 : 'fail'} (expected 4) | n=8 solutions: ${match8 ? 92 : 'fail'} (expected 92)`
        };
      }
    },
    {
      id: 'ham_pathological',
      name: 'Hamiltonian Pathological Instance (n=9 -> No cycle + high rejection)',
      run: () => {
        const res = executeSingleRun('Hamiltonian', 9, 'pathological', 1);
        const pass = res.result.info.includes('No Hamiltonian cycle exists') && res.result.pr > 1000;
        return {
          pass,
          details: `Result: ${res.result.info} | Pruned/Rejected: ${res.result.pr}`
        };
      }
    },
    {
      id: 'tsp_pruning',
      name: 'TSP Branch & Bound Euclidean n=8 (Verifier passes & Pruned count > 0)',
      run: () => {
        const res = executeSingleRun('TSP', 8, 'euclidean', 123);
        const pass = res.result.ok && res.result.pr > 0;
        return {
          pass,
          details: `Verified: ${res.result.ok ? 'PASS' : 'FAIL'} | Optimal Tour Cost: ${res.result.bestCost} | States Pruned: ${res.result.pr}`
        };
      }
    },
    {
      id: 'ds_verifiers',
      name: 'Data Structures Verifiers (Binomial, Fibonacci, B-Tree, RB-Tree @ n=1000 all 4 families)',
      run: () => {
        const dsAlgs = ['Binomial Heap', 'Fibonacci Heap', 'B-Tree', 'Red-Black Tree'];
        const families = ['random', 'ascending', 'descending', 'duplicates'];
        let allPass = true;
        let checks = 0;

        for (const alg of dsAlgs) {
          for (const fam of families) {
            const res = executeSingleRun(alg, 1000, fam, 1);
            checks++;
            if (!res.result.ok) {
              allPass = false;
              return {
                pass: false,
                details: `FAILED check on ${alg} with family ${fam} at n=1000`
              };
            }
          }
        }

        return {
          pass: allPass,
          details: `All ${checks} / ${checks} data structure verification suites PASSED flawlessly at n=1000`
        };
      }
    },
    {
      id: 'fw_bench_norm',
      name: 'Floyd-Warshall Benchmark Ops/Theory Normalization (10 to 40 step 10 -> ratio ~1.00)',
      run: () => {
        const sizes = [10, 20, 30, 40];
        const points = sizes.map(n => executeSingleRun('Floyd-Warshall', n, 'random', 1));
        const r0 = points[0].result.ops / points[0].result.th;
        const ratios = points.map(p => (p.result.ops / p.result.th) / r0);
        const pass = ratios.every(r => Math.abs(r - 1.0) < 0.01);
        return {
          pass,
          details: `Normalized Ops/Theory ratios: [${ratios.map(r => r.toFixed(2)).join(', ')}] (all exactly ~1.00)`
        };
      }
    },
    {
      id: 'timeout_safety',
      name: 'N-Queens All-Solutions Time-out Protection (stops safely & reports HIGH risk)',
      run: () => {
        // Set short temporary deadline for test
        const prevDeadline = EXECUTION_DEADLINE;
        EXECUTION_DEADLINE = performance.now() + 50; // 50ms deadline
        const res = executeSingleRun('N-Queens', 14, 'all', 1);
        EXECUTION_DEADLINE = prevDeadline;

        const [risk] = classifyRisk(res.ms, res.to, 5.0);
        const pass = (res.to || risk === 'HIGH') && res.result.ops > 0;
        return {
          pass,
          details: `Execution interrupted safely: ${res.to ? 'TIMEOUT caught' : 'Completed early'} | Risk assigned: ${risk} | States evaluated: ${res.result.ops}`
        };
      }
    }
  ];

  const results = [];
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    await new Promise(r => setTimeout(r, 10)); // yield UI
    let outcome;
    try {
      outcome = t.run();
    } catch (err) {
      outcome = { pass: false, details: `Exception: ${err.message || err}` };
    }
    results.push({
      name: t.name,
      pass: outcome.pass,
      details: outcome.details
    });
    if (onProgress) onProgress((i + 1) / tests.length, results);
  }

  return results;
}

if (typeof globalThis !== 'undefined') {
  globalThis.runAcceptanceTests = runAcceptanceTests;
}
