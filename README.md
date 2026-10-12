# DAA Algorithm Vulnerability and Stress-Testing Laboratory

An interactive university laboratory web application for the **Design and Analysis of Algorithms (DAA)** course.

The laboratory investigates the core question:
> **"Under what input or workload conditions does the technique become undesirable or infeasible?"**

Every experiment evaluates:
$$\text{Theoretical Bound} \longrightarrow \text{Generated Adversarial Workload} \longrightarrow \text{Observed Measurements} \longrightarrow \text{Engineering Risk Classification}$$

---

## Quick Start (Zero Setup Required)

This application is built with **100% Vanilla HTML5, CSS3, and JavaScript** using standard `<script>` tags. It requires **no backend, no npm, no build step, and no local server**.

1. Navigate to the project directory:
   ```
   c:\Users\Hansith Kasani\Downloads\DAA PBL
   ```
2. **Double-click `index.html`** in File Explorer (or open `file:///.../index.html` in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).
3. Explore the **Dashboard**, switch between **Light (default)** and **Dark** themes, run single experiments, launch benchmark sweeps, step through algorithms in the visualizer, or run the live **Acceptance Test Suite**.

---

## Architectural Design

```
+-----------------------------------------------------------------------------------+
|                                User Interface                                    |
|   Dashboard  |  Algorithm Workbench  |  Complexity Matrix  |  Acceptance Tests    |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+---------------------------------+             +---------------------------------+
|     Input Generator (RNG)       |             |     Central Registry (A)        |
|  - Mulberry32 PRNG (Seeded)     |             |  - 13 Algorithms                |
|  - 4 Data Structure Families    |             |  - Test Family Definitions      |
|  - Sparse/Dense Graph Families  |             |  - Default/Max Size Thresholds  |
|  - Adversarial Knapsack & Clique|             |  - Theoretical Operation Models |
+---------------------------------+             +---------------------------------+
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
+-----------------------------------------------------------------------------------+
|                              Execution Pipeline                                   |
|   1. Generate Configured Input: I = A[alg].gen(n, family, seed)                  |
|   2. Isolated Execution Timing: performance.now() [No generation/tracing overhead] |
|   3. Verifier Execution (Post-Timing): Invariant verification                    |
|   4. Empirical Risk Classifier: Categorize LOW, MODERATE, HIGH                   |
|   5. LocalStorage History & Markdown Report Generation                            |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+---------------------------------+             +---------------------------------+
|     Step-by-Step Visualizer     |             |       Benchmark Engine          |
|  - Dynamic Canvas/DOM Renderers |             |  - Asynchronous Batch Sweeps    |
|  - Chessboard, Graph, Tree Maps |             |  - Multi-series Canvas Charts   |
|  - Plain-English Step Tracing   |             |  - Normalized Ops/Theory Ratio  |
+---------------------------------+             +---------------------------------+
```

### Core Architecture Principles
1. **No Simulated/Fake Data**: Every metric, operation count, and execution time comes from real execution of the algorithm in JavaScript.
2. **Isolated High-Precision Timing**: The timed section strictly encloses only the algorithm execution via `performance.now()`. Input generation, post-run correctness verification, and visual tracing are strictly outside the timer.
3. **Reproducibility**: The `mulberry32` 32-bit PRNG ensures an input is 100% reproducible given `(size, family, seed)`.
4. **Memory Estimation**: Memory is calculated as `element count x assumed bytes per element` and explicitly labeled as an estimate in the UI.
5. **Epistemological Rigor**: Empirical data is stated as **"consistent with"** the theoretical bound, never claiming to "prove" asymptotic complexity.

---

## The 13 Implemented Algorithms

### 1. Advanced Data Structures
* **Binomial Heap**:
  * *Workload*: $n$ inserts, $\lfloor n/4 \rfloor$ decrease-keys, $n$ extract-mins.
  * *Complexity*: Insert $O(1)$ amortized / $O(\log n)$ worst, Extract-Min $O(\log n)$, Decrease-Key $O(\log n)$, Space $O(n)$.
  * *Weakness*: Every decrease-key bubbles up toward the root, and extract-min requires full binary union of trees.
* **Fibonacci Heap**:
  * *Workload*: $n$ inserts, $\lfloor n/4 \rfloor$ decrease-keys, $n$ extract-mins.
  * *Complexity*: Insert $O(1)$, Decrease-Key $O(1)$ amortized (via cuts & cascading cuts), Extract-Min $O(\log n)$ amortized, Space $O(n)$.
  * *Weakness*: Single extract-min consolidates $O(n)$ lazy roots in a single pass; higher constant factor on small datasets.
* **B-Tree ($t=3$, min degree 3, max keys 5)**:
  * *Workload*: $n$ inserts with proactive median-split, $\lfloor n/4 \rfloor$ searches, $\lfloor n/4 \rfloor$ deletions with borrow & merge.
  * *Complexity*: Search/Insert/Delete $O(\log n)$, Height $O(\log_t n)$, Space $O(n)$.
  * *Weakness*: Monotonically ascending insertions force continuous node splitting, leaving nodes at 50% capacity (half-full).
* **Red-Black Tree**:
  * *Workload*: $n$ inserts with recoloring & rotations (Cases 1, 2, 3), searches, and deletions with RB-delete-fixup (Cases 1, 2, 3, 4).
  * *Complexity*: Search $O(\log n)$, Insert $O(\log n)$ ($\le 2$ rotations), Delete $O(\log n)$ ($\le 3$ rotations), Height $\le 2\log_2(n+1)$, Space $O(n)$.
  * *Weakness*: Monotonic inputs trigger rotations and recolorings on almost every insert.

### 2. Minimum Spanning Tree (MST)
* **Prim's Algorithm**:
  * *Structure*: Adjacency list + binary min-heap.
  * *Complexity*: $O(E \log V)$ time, $O(V + E)$ space.
  * *Weakness*: Dense graphs ($E \approx V^2 / 2$) push $O(E)$ elements through the heap; an un-heaped $O(V^2)$ matrix Prim is superior there.
* **Kruskal's Algorithm**:
  * *Structure*: Edge list sort + Disjoint Set Union (DSU) with union-by-rank and path compression.
  * *Complexity*: $O(E \log E) = O(E \log V)$ time, $O(V + E)$ space.
  * *Weakness*: Dominated by sorting all $E$ edges globally. On dense graphs, sorting $V^2$ edges makes Kruskal significantly slower than Prim.
* *Matched Comparison*: Prim and Kruskal execute on identical connected graphs generated from the same seed, comparing total cost and verifying $V-1$ edges.

### 3. Knapsack Problems
* **Fractional Knapsack**:
  * *Algorithm*: Greedy value-to-weight ratio sort + partial item division.
  * *Complexity*: $O(n \log n)$ time, $O(n)$ space. In **P**.
* **0/1 Knapsack (DP)**:
  * *Algorithm*: Bottom-up Dynamic Programming table $DP[i][c] = \max(DP[i-1][c], DP[i-1][c-w_i] + v_i)$ with item backtracking.
  * *Complexity*: $\Theta(nC)$ pseudo-polynomial time and space. Decision form is **NP-complete**; optimization is **NP-hard**.
  * *Safety Cap*: Refuses table allocation if $(n+1)(C+1) > 4,000,000$ cells, preventing browser crash and reporting HIGH risk.
* *Adversarial Greedy-Failure Instance*:
  * Capacity $C = 10$, Items: $(w=6, v=12), (w=5, v=9), (w=5, v=9)$.
  * **Fractional Optimal**: $19.20$ (Item 0 + $4/5$ of Item 1).
  * **0/1 DP Optimal**: $18.00$ (Item 1 + Item 2).
  * **0/1 Greedy-by-Ratio**: $12.00$ (Picks Item 0, cannot fit Item 1 or 2). Demonstrates the exact failure gap of greedy strategies on discrete knapsack.

### 4. Dynamic Programming
* **Floyd-Warshall All-Pairs Shortest Paths**:
  * *Algorithm*: Triple loop $O(V^3)$ relaxation across all intermediate vertices $k$.
  * *Complexity*: $\Theta(V^3)$ time, $\Theta(V^2)$ space. In **P**.
  * *Weakness*: Rigid cubic complexity independent of edge density. On sparse graphs ($E = 2V$), running Dijkstra $V$ times in $O(V E \log V)$ is dramatically faster.
* **Matrix Chain Multiplication (MCM)**:
  * *Algorithm*: DP tables $m[i,j]$ and split points $s[i,j]$.
  * *Complexity*: $\Theta(n^3)$ time, $\Theta(n^2)$ space. Exact inner loop ops $= \frac{n^3 - n}{6}$.
  * *Comparison*: Computes naive left-to-right multiplication cost vs optimal paren order.

### 5. Backtracking & Branch and Bound
* **N-Queens**:
  * *Algorithm*: Column, main diagonal, and anti-diagonal bitmask tracking with backtracking.
  * *Modes*: `first` (single solution) and `all` (exhaustive enumeration).
  * *Complexity*: $O(n!)$ search tree. Standard N-Queens is **NOT** labelled NP-complete (constructible in polynomial time).
  * *Known Solutions*: $n=6 \to 4$, $n=8 \to 92$, $n=10 \to 724$, $n=12 \to 14,200$.
* **Hamiltonian Cycle**:
  * *Algorithm*: Backtracking cycle search from vertex 0.
  * *Complexity*: Worst-case $O((n-1)!)$. Decision form is **NP-complete**.
  * *Pathological Instance*: Clique $K_{n-1}$ plus vertex $n-1$ connected only to vertex 0 (no cycle exists, forcing exhaustive search of the entire factorial state space).
* **Traveling Salesperson Problem (TSP) Branch & Bound**:
  * *Algorithm*: Nearest-neighbor greedy upper bound + minimum outgoing edge lower bound pruning.
  * *Complexity*: $O((n-1)!)$ worst-case. Optimization is **NP-hard**; decision form is **NP-complete**.
  * *Weakness*: On random non-metric matrices where triangle inequality fails, lower bounds are loose, causing search tree explosion beyond ~11 cities.

---

## Complexity Classification Matrix

| Problem | Decision Form | Optimization Form | Complexity Class | Theoretical Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Hamiltonian Cycle** | Does a simple cycle through all vertices exist? (YES/NO) | Find such a simple cycle | Decision: **NP-complete**<br>Search: **NP-hard** | Candidate path is verifiable in $O(V)$ polynomial time; finding one requires worst-case exponential search. |
| **TSP** | Is there a tour of cost $\le K$? (YES/NO) | Find the tour minimizing total travel cost | Decision: **NP-complete**<br>Optimization: **NP-hard** | Optimization outputs a cost/tour rather than a boolean answer, making it at least as hard as the decision version. |
| **0/1 Knapsack** | Is there a subset with weight $\le W$ and value $\ge V$? | Maximize value within capacity $W$ | Decision: **NP-complete**<br>Optimization: **NP-hard**<br>DP: **Pseudo-Polynomial** | Capacity $C$ requires $\log_2 C$ bits. $O(nC)$ is exponential in bit length; large capacities cause exponential blowup. |
| **Fractional Knapsack** | — | Maximize value with divisible items | **In P** ($O(n \log n)$) | Item divisibility establishes the greedy-choice property. |
| **N-Queens** | Does a valid placement exist? (Always YES for $n \ge 4$) | Find one / enumerate all | **NOT NP-complete** | Explicit polynomial constructions exist for all $n \ge 4$. |
| **MST (Prim/Kruskal)** | Is there a spanning tree with weight $\le W$? | Find minimum-weight spanning tree | **In P** ($O(E \log V)$) | Matroid greedy property guarantees optimal polynomial convergence. |
| **Floyd-Warshall / MCM** | — | Find all-pairs shortest paths / optimal paren order | **In P** ($\Theta(V^3)$, $\Theta(n^3)$) | Dynamic programming decomposes overlapping subproblems into polynomial tabular states. |

---

## Risk Classification & Engineering Thresholds

Thresholds are configurable live in the left sidebar:
* **Moderate Latency Threshold**: Default $50\text{ ms}$
* **High Latency Threshold**: Default $1000\text{ ms}$
* **Timeout Safety Limit**: Default $5.0\text{ s}$

### Classification Rules:
* **HIGH RISK**: Execution timed out, exceeded memory cell cap ($>4\text{M}$ cells), or measured execution time $\ge 1000\text{ ms}$. Exact computation is infeasible for this workload.
* **MODERATE RISK**: Measured time $\ge 50\text{ ms}$, or empirical growth exponent $\ge 4.0$ ($\text{operations} \propto n^{\ge 4}$). Noticeable scaling bottleneck.
* **LOW RISK**: Measured time $< 50\text{ ms}$ with sub-critical growth exponent. Highly practical for production deployment.

---

## Acceptance Test Verification Report

All 10 required acceptance assertions were verified live against real algorithm executions:

| # | Acceptance Test | Expected Standard | Observed Live Measurement | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Floyd-Warshall Loop Counting | $V=10 \to 1000\text{ ops}$, $V=20 \to 8000\text{ ops}$ | $V=10: 1,000\text{ ops}$, $V=20: 8,000\text{ ops}$ | **PASSED** |
| **2** | Matrix Chain Inner Operations | $n=10 \to (10^3 - 10)/6 = 165\text{ ops}$ | $n=10: 165\text{ ops}$ | **PASSED** |
| **3** | Prim vs Kruskal Equivalence | Identical MST cost & $V-1$ edges on same seed | Prim Cost: 275 (29 edges) = Kruskal Cost: 275 (29 edges) | **PASSED** |
| **4** | Adversarial Knapsack Failure Gap | Frac $= 19.2$, 0/1 DP $= 18$, Greedy $= 12$ | Frac $= 19.2$, 0/1 DP $= 18$, Greedy $= 12$ | **PASSED** |
| **5** | N-Queens Solution Counts | $n=6 \to 4$, $n=8 \to 92$ | $n=6: 4\text{ solutions}$, $n=8: 92\text{ solutions}$ | **PASSED** |
| **6** | Hamiltonian Pathological Search | $n=9$ reports no cycle & large rejection count | No cycle found; States: 109,608, Rejected: 95,908 | **PASSED** |
| **7** | TSP Euclidean Branch & Bound | Verified valid tour & pruned branches $> 0$ | Verified PASS, Cost: 303, Pruned: 1,289 branches | **PASSED** |
| **8** | Data Structures Verifiers @ $n=1000$ | Invariants hold for all 4 families | All 16 / 16 suites PASSED (Sorted & balanced) | **PASSED** |
| **9** | Floyd-Warshall Benchmark Normalization | Normalized Ops/Theory ratio $\approx 1.00$ | $[1.00, 1.00, 1.00, 1.00]$ | **PASSED** |
| **10**| N-Queens Timeout Guard | Halts safely at deadline and reports HIGH risk | Interrupted safely, Assigned Risk: HIGH | **PASSED** |

---

## File Structure

```
DAA PBL/
├── index.html            # Main entry point (double-click to open in any browser)
├── README.md             # Project documentation and theoretical analysis
├── css/
│   └── styles.css        # Minimalist, clean senior-developer light theme
└── js/
    ├── rng.js            # Mulberry32 seeded PRNG & workload test family generators
    ├── algorithms.js     # Instrumented implementations of all 13 algorithms in registry A
    ├── visualizers.js    # Canvas & DOM step renderers (Chessboard, Graph, Trees, DP)
    ├── benchmarks.js     # Asynchronous benchmark suite, canvas chart, and risk classifier
    ├── tests.js          # Built-in live test suite executing the 10 acceptance criteria
    └── app.js            # UI controller, stepper playback, history export, and report generator
```
