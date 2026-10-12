# DAA Algorithm Vulnerability & Stress-Testing Laboratory — Comprehensive Viva Preparation Guide

This guide is designed for **B.Tech Semester III Design and Analysis of Algorithms (DAA)** students. It covers project architecture, theoretical foundations, line-by-line algorithm walkthroughs, worked examples, pseudocode, asymptotic complexity breakdowns ($O, \Omega, \Theta$), and exhaustive Viva Voce questions and answers.

---

## 1. Project Overview & Core Philosophy

### What is the purpose of this project?
The **DAA Algorithm Vulnerability and Stress-Testing Laboratory** investigates the fundamental engineering question:
> **"Under what input or workload conditions does an algorithm become undesirable or infeasible?"**

Rather than simply demonstrating that algorithms work on textbook inputs, this laboratory generates **adversarial and edge-case workloads** to expose the structural bottlenecks, asymptotic tipping points, and memory/time boundaries of 13 foundational DAA algorithms across:
1. **Advanced Data Structures** (Binomial Heap, Fibonacci Heap, B-Tree, Red-Black Tree)
2. **Minimum Spanning Trees** (Prim's Algorithm, Kruskal's Algorithm)
3. **Knapsack Problems** (Fractional Greedy, 0/1 Dynamic Programming)
4. **Dynamic Programming** (Floyd-Warshall APSP, Matrix Chain Multiplication)
5. **Backtracking & Branch and Bound** (N-Queens, Hamiltonian Cycle, TSP Branch & Bound)

### What are the core rules of the implementation?
1. **Zero Simulated/Fake Data**: All numbers, timings, operation counts, and states come from genuine un-instrumented execution in JavaScript.
2. **Isolated High-Precision Timing**: `performance.now()` measures *only* the algorithm execution. Input generation, correctness verification, and visual tracing are excluded.
3. **Reproducibility**: The `mulberry32` 32-bit PRNG ensures an input is 100% reproducible from `(size, family, seed)`.
4. **Post-Execution Invariant Verification**: A formal mathematical verifier function `v()` runs *after* timing to validate structural and computational invariants.
5. **Epistemological Honesty**: Empirical data is stated as **"consistent with"** expected asymptotic bounds, not "proving" complexity.

---

## 2. In-Depth Algorithm Breakdown, Pseudocode & Complexity Analysis

---

### Module I & II: Advanced Data Structures

#### 1. Binomial Heap
* **File & Function**: `js/algorithms.js` -> `createBinomialHeap()`, `runBinomialHeap()`
* **Concept**: A collection of binomial trees $B_0, B_1, B_2, \dots$ where each tree $B_k$ has $2^k$ nodes, height $k$, and root degree $k$. The degree sequence corresponds to the binary representation of $n$.
* **Workload**: $n$ inserts $\to \lfloor n/4 \rfloor$ decrease-keys $\to n$ extract-mins.
* **Pseudocode**:
  ```
  function LINK(B1, B2):
      if B2.key < B1.key: swap(B1, B2)
      B2.parent = B1
      B1.children.push(B2)
      return B1

  function INSERT(Heap, key):
      node = newNode(key)
      ADD_TREE(Heap, node) // Binary addition with carry propagation
  ```
* **Asymptotic Complexities**:
  * **Insert**: $O(1)$ amortized, $\Theta(\log n)$ worst-case.
  * **Extract-Min**: $\Theta(\log n)$ (removes root, reverses children, unions with remaining trees).
  * **Decrease-Key**: $\Theta(\log n)$ (bubbles up to parent).
  * **Merge (Union)**: $\Theta(\log n)$ (equivalent to binary addition of two numbers).
  * **Auxiliary Space**: $\Theta(n)$ for tree node pointers.
* **Vulnerability & Bottleneck**: Sequential decrease-keys and extract-mins always pay $\Theta(\log n)$ strictly due to rigid tree structures, losing to lazy heaps on heavy decrease-key workloads.

---

#### 2. Fibonacci Heap
* **File & Function**: `js/algorithms.js` -> `createFibonacciHeap()`, `runFibonacciHeap()`
* **Concept**: A lazy collection of min-heap-ordered trees stored in a circular doubly-linked root list. Consolidates trees of identical degree only during `extractMin()`. Uses node marking for cascading cuts during `decreaseKey()`.
* **Pseudocode**:
  ```
  function DECREASE_KEY(Heap, x, newKey):
      x.key = newKey
      p = x.parent
      if p != null and x.key < p.key:
          CUT(Heap, x, p)
          CASCADING_CUT(Heap, p)
      if x.key < Heap.min.key:
          Heap.min = x

  function CASCADING_CUT(Heap, y):
      z = y.parent
      if z != null:
          if not y.marked:
              y.marked = true
          else:
              CUT(Heap, y, z)
              CASCADING_CUT(Heap, z)
  ```
* **Asymptotic Complexities**:
  * **Insert**: $\Theta(1)$ actual.
  * **Decrease-Key**: $O(1)$ amortized ($O(n)$ single-operation worst-case with cascading cuts).
  * **Extract-Min**: $O(\log n)$ amortized ($O(n)$ single-operation consolidation).
  * **Merge**: $\Theta(1)$ (circular list splicing).
  * **Auxiliary Space**: $\Theta(n)$.
* **Vulnerability & Bottleneck**: High constant-factor and pointer overhead. A single `extractMin` following many lazy inserts is forced to consolidate up to $O(n)$ roots simultaneously.

---

#### 3. B-Tree (Minimum Degree $t = 3$)
* **File & Function**: `js/algorithms.js` -> `createBTree()`, `runBTree()`
* **Concept**: Self-balancing multi-way search tree. Every node (except root) contains between $t-1 = 2$ and $2t-1 = 5$ keys, and has between $t = 3$ and $2t = 6$ children. Proactive splitting splits full nodes top-down on insertion.
* **Pseudocode**:
  ```
  function SPLIT_CHILD(parent, i, child):
      newNode = createNode(isLeaf=child.isLeaf)
      newNode.keys = child.keys[t ... 2t-2]
      median = child.keys[t-1]
      child.keys = child.keys[0 ... t-2]
      parent.keys.insert(i, median)
      parent.children.insert(i+1, newNode)
  ```
* **Asymptotic Complexities**:
  * **Search**: $\Theta(\log_t n) = \Theta(\log n)$.
  * **Insert**: $\Theta(\log_t n) = \Theta(\log n)$.
  * **Delete**: $\Theta(\log_t n) = \Theta(\log n)$.
  * **Auxiliary Space**: $\Theta(n)$.
* **Vulnerability & Bottleneck**: Monotonically sorted insertions force continuous right-hand node splits, producing trees with minimum-fill (50% capacity) nodes, doubling tree height compared to random insertion.

---

#### 4. Red-Black Tree
* **File & Function**: `js/algorithms.js` -> `createRBTree()`, `runRBTree()`
* **Concept**: Self-balancing Binary Search Tree enforcing 5 properties:
  1. Every node is Red or Black.
  2. Root is Black.
  3. Every leaf (NIL) is Black.
  4. If a node is Red, both children are Black (no consecutive red nodes).
  5. Every path from root to NIL has the exact same black-height $bh$.
* **Pseudocode**:
  ```
  function INSERT_FIXUP(T, z):
      while z.parent != null and z.parent.color == RED:
          if z.parent == z.parent.parent.left:
              uncle = z.parent.parent.right
              if uncle.color == RED:          // Case 1: Recolor
                  z.parent.color = BLACK
                  uncle.color = BLACK
                  z.parent.parent.color = RED
                  z = z.parent.parent
              else:
                  if z == z.parent.right:      // Case 2: Left Rotate
                      z = z.parent
                      LEFT_ROTATE(T, z)
                  z.parent.color = BLACK      // Case 3: Right Rotate
                  z.parent.parent.color = RED
                  RIGHT_ROTATE(T, z.parent.parent)
  ```
* **Asymptotic Complexities**:
  * **Search**: $O(\log n)$, $\Theta(\log n)$ worst-case.
  * **Insert**: $O(\log n)$ ($\le 2$ rotations).
  * **Delete**: $O(\log n)$ ($\le 3$ rotations).
  * **Tree Height**: $\le 2 \log_2(n+1)$.
  * **Auxiliary Space**: $\Theta(n)$.
* **Vulnerability & Bottleneck**: Monotonic input streams (ascending/descending) trigger structural rotations and recoloring fixes on almost every insertion.

---

### Module II & III: Minimum Spanning Tree (MST) & Greedy Methods

#### 5. Prim's Algorithm
* **File & Function**: `js/algorithms.js` -> `runPrimMST()`
* **Concept**: Grows a single spanning tree from vertex 0, greedily adding the cheapest edge connecting an unvisited vertex to the existing tree using a Binary Min-Heap and adjacency list.
* **Pseudocode**:
  ```
  function PRIM(G):
      inMST = array of size V (all 0)
      inMST[0] = 1
      minHeap.push(all edges incident to vertex 0)
      while minHeap is not empty and mstEdges.length < V - 1:
          (weight, u, from) = minHeap.pop()
          if inMST[u]: continue
          inMST[u] = 1
          mstEdges.push((from, u, weight))
          for each (v, w) in adj[u]:
              if not inMST[v]: minHeap.push((w, v, u))
  ```
* **Asymptotic Complexities**:
  * **Time Complexity**: $\Theta(E \log V)$ with binary heap & adjacency list.
  * **Auxiliary Space**: $\Theta(V + E)$.
* **Vulnerability & Bottleneck**: On dense graphs ($E \approx V^2/2$), pushing $O(E)$ candidate edges into the heap incurs heavy $O(E \log V)$ logarithmic overhead. An adjacency matrix Prim without a heap achieves $\Theta(V^2)$ and is faster on dense graphs.

---

#### 6. Kruskal's Algorithm
* **File & Function**: `js/algorithms.js` -> `runKruskalMST()`
* **Concept**: Global edge sort + Disjoint Set Union (DSU) with path compression and union-by-rank. Adds edges in non-decreasing order if they do not create a cycle.
* **Pseudocode**:
  ```
  function KRUSKAL(G):
      sort edges by weight ascending
      init DSU parent[0...V-1], rank[0...V-1]
      for each (u, v, w) in sortedEdges:
          if FIND(u) != FIND(v):
              UNION(u, v)
              mstEdges.push((u, v, w))
              if mstEdges.length == V - 1: break
  ```
* **Asymptotic Complexities**:
  * **Time Complexity**: $\Theta(E \log E) = \Theta(E \log V)$ for sorting edges + $\Theta(E \cdot \alpha(V))$ for DSU operations.
  * **Auxiliary Space**: $\Theta(V + E)$.
* **Vulnerability & Bottleneck**: Dominated by edge sorting. When $E \approx V^2$, sorting $V^2$ edges makes Kruskal noticeably slower than Prim.

---

### Module I & II: Knapsack Problems

#### 7. Fractional Knapsack (Greedy)
* **File & Function**: `js/algorithms.js` -> `runFractionalKnapsack()`
* **Concept**: Divisible items. Calculates ratio $r_i = v_i / w_i$, sorts descending, greedily takes full items, and divides the final fitting item.
* **Asymptotic Complexities**:
  * **Time Complexity**: $\Theta(n \log n)$ for sorting + $\Theta(n)$ for selection $\implies \Theta(n \log n)$.
  * **Auxiliary Space**: $\Theta(n)$. In class **P**.

---

#### 8. 0/1 Knapsack (Dynamic Programming)
* **File & Function**: `js/algorithms.js` -> `run01Knapsack()`
* **Concept**: Indivisible items. Builds bottom-up DP table $DP[i][c] = \max(DP[i-1][c], DP[i-1][c-w_i] + v_i)$ for $1 \le i \le n, 0 \le c \le C$.
* **Pseudocode**:
  ```
  function KNAPSACK_01(w, v, C):
      table = 2D array (n+1) x (C+1)
      for i = 1 to n:
          for c = 0 to C:
              if c >= w[i-1]:
                  table[i][c] = max(table[i-1][c], table[i-1][c - w[i-1]] + v[i-1])
              else:
                  table[i][c] = table[i-1][c]
      return table[n][C]
  ```
* **Asymptotic Complexities**:
  * **Time Complexity**: $\Theta(nC)$.
  * **Auxiliary Space**: $\Theta(nC)$ (or $O(C)$ if only optimal value is needed).
  * **Complexity Class**: Decision is **NP-complete**; Optimization is **NP-hard**; DP is **Pseudo-Polynomial** because runtime depends on the numeric magnitude $C$, which takes $\log_2 C$ bits to represent.
* **Adversarial Failure Case**:
  * Capacity $C = 10$, Items: $(w=6, v=12), (w=5, v=9), (w=5, v=9)$.
  * Fractional Greedy: $12 + (4/5) \times 9 = 19.2$.
  * 0/1 DP Optimal: $9 + 9 = 18$ (items 1 & 2, total weight 10).
  * 0/1 Greedy-by-Ratio: 12 (picks item 0, remaining capacity 4 cannot fit weight 5).

---

### Module I & III: Dynamic Programming

#### 9. Floyd-Warshall All-Pairs Shortest Paths
* **File & Function**: `js/algorithms.js` -> `runFloydWarshall()`
* **Concept**: Triple nested loop dynamic programming. Tests whether the shortest path from $i$ to $j$ can be improved by passing through intermediate vertex $k$:
  $$\text{dist}^{(k)}[i][j] = \min\left(\text{dist}^{(k-1)}[i][j], \text{dist}^{(k-1)}[i][k] + \text{dist}^{(k-1)}[k][j]\right)$$
* **Asymptotic Complexities**:
  * **Time Complexity**: Exact $\Theta(V^3)$ (Inner loop iterations strictly equal $V^3$).
  * **Auxiliary Space**: $\Theta(V^2)$. In class **P**.
* **Vulnerability & Bottleneck**: Rigid cubic time regardless of graph density. For sparse graphs ($E = 2V$), running Dijkstra $V$ times in $O(V E \log V)$ is exponentially faster.

---

#### 10. Matrix Chain Multiplication (MCM)
* **File & Function**: `js/algorithms.js` -> `runMatrixChain()`
* **Concept**: Finds parenthesization minimizing total scalar multiplications for a sequence of matrices $A_1 \times A_2 \times \dots \times A_n$ using DP recurrence:
  $$m[i,j] = \min_{i \le k < j} \left( m[i,k] + m[k+1,j] + p_{i-1} p_k p_j \right)$$
* **Asymptotic Complexities**:
  * **Time Complexity**: $\Theta(n^3)$. Inner loop operations strictly equal $\frac{n^3 - n}{6}$.
  * **Auxiliary Space**: $\Theta(n^2)$ for cost table $m$ and split table $s$.
* **Brute-Force vs DP**: Brute-force evaluates all parenthesizations, which grow by Catalan numbers:
  $$C(n-1) = \frac{1}{n}\binom{2n-2}{n-1} = \Omega\left(\frac{4^n}{n^{1.5}}\right)$$
  Dynamic programming reduces this exponential explosion to polynomial $\Theta(n^3)$.

---

### Module I: Backtracking & Branch and Bound

#### 11. N-Queens (Backtracking)
* **File & Function**: `js/algorithms.js` -> `runNQueens()`
* **Concept**: Places $n$ non-attacking queens on an $n \times n$ chessboard. Tracks attacks using 3 lookup arrays: `col[c]`, `diag1[r+c]`, and `diag2[r-c+n-1]`.
* **Asymptotic Complexities**:
  * **Time Complexity**: $O(n!)$ search tree for exhaustive enumeration.
  * **Auxiliary Space**: $\Theta(n)$ recursion stack and bitmask arrays.
  * **Classification Note**: Standard N-Queens is **NOT** NP-complete (constructive polynomial algorithms exist for $n \ge 4$).

---

#### 12. Hamiltonian Cycle (Backtracking)
* **File & Function**: `js/algorithms.js` -> `runHamiltonian()`
* **Concept**: Searches for a simple cycle visiting all $n$ vertices exactly once and returning to vertex 0.
* **Pathological Worst-Case Family**: Clique $K_{n-1}$ on vertices $0 \dots n-2$ plus one vertex $n-1$ connected ONLY to vertex 0. Degree of vertex $n-1$ is 1, so no Hamiltonian cycle can exist. The algorithm is forced to explore the entire $(n-1)!$ factorial permutation space.
* **Asymptotic Complexities**:
  * **Time Complexity**: $O((n-1)!)$ worst-case, $\Omega(n)$ best-case.
  * **Auxiliary Space**: $\Theta(V)$ path stack + $\Theta(V^2)$ adjacency matrix.
  * **Complexity Class**: Decision form is **NP-complete**.

---

#### 13. Traveling Salesperson Problem (TSP Branch and Bound)
* **File & Function**: `js/algorithms.js` -> `runTSP()`
* **Concept**:
  1. **Initial Upper Bound**: Nearest Neighbor heuristic tour.
  2. **Lower Bound at Subproblem**: $\text{cost\_so\_far} + \sum_{v \in \text{unvisited}} \min_{u \ne v} \text{dist}(v, u)$.
  3. **Pruning Condition**: If $\text{lower\_bound} \ge \text{best\_known\_cost}$, prune the entire subtree immediately.
* **Asymptotic Complexities**:
  * **Time Complexity**: $O((n-1)!)$ worst-case.
  * **Auxiliary Space**: $\Theta(n^2)$ distance matrix + $\Theta(n)$ state stack.
  * **Complexity Class**: Decision form is **NP-complete**; Optimization is **NP-hard**.

---

## 3. Top 40 DAA Viva Voce Questions & Model Answers

### Category 1: Algorithm Analysis & Complexity Foundations

**Q1: What is the difference between Big-O ($O$), Big-Omega ($\Omega$), and Big-Theta ($\Theta$) notations?**
> **Answer**:
> - **Big-O ($O$)**: Asymptotic upper bound ($f(n) \le c \cdot g(n)$ for $n \ge n_0$). It describes the worst-case growth rate.
> - **Big-Omega ($\Omega$)**: Asymptotic lower bound ($f(n) \ge c \cdot g(n)$ for $n \ge n_0$). It describes the best-case baseline.
> - **Big-Theta ($\Theta$)**: Asymptotically tight bound ($c_1 g(n) \le f(n) \le c_2 g(n)$ for $n \ge n_0$). It holds when an algorithm's upper and lower bounds coincide.

**Q2: Why does your project state that empirical benchmark data is "consistent with" a bound rather than "proving" it?**
> **Answer**: Empirical benchmarks measure execution times on finite sampled inputs subject to operating system scheduling, memory caching, and runtime overhead. Asymptotic complexity ($O, \Theta$) is a mathematical property as $n \to \infty$. A normalized operations/theory ratio remaining near $1.00$ confirms that observed growth aligns with theory, but formal mathematical induction is required to prove asymptotic bounds.

**Q3: What is the difference between Time Complexity and Auxiliary Space Complexity?**
> **Answer**: Time complexity measures the number of elementary operations performed as a function of input size. Auxiliary space complexity measures *only the temporary/extra memory* allocated during algorithm execution, excluding the memory used by the input itself.

**Q4: What is a Pseudo-Polynomial algorithm, and why is 0/1 Knapsack DP classified as one?**
> **Answer**: An algorithm is pseudo-polynomial if its runtime is polynomial in the *numeric value* of the input, but exponential in the *bit-length* of the input. In 0/1 Knapsack, the time complexity is $\Theta(nC)$. The capacity $C$ is stored in $k = \log_2 C$ bits. Thus, $\Theta(nC) = \Theta(n \cdot 2^k)$, which is exponential with respect to the input size in bits.

---

### Category 2: Advanced Data Structures (Heaps & Trees)

**Q5: What is a Binomial Tree $B_k$, and how many nodes does it contain?**
> **Answer**: A Binomial Tree $B_k$ of order $k$ is formed by linking two $B_{k-1}$ trees such that the root of one becomes the leftmost child of the other. It has $2^k$ nodes, height $k$, root degree $k$, and exactly $\binom{k}{i}$ nodes at depth $i$.

**Q6: Why is Decrease-Key $O(1)$ amortized in a Fibonacci Heap but $O(\log n)$ in a Binomial Heap?**
> **Answer**: In a Binomial Heap, decreasing a key requires bubbling the value upward along tree height, taking $O(\log n)$ swaps. In a Fibonacci Heap, the node is cut directly from its parent in $O(1)$ time and moved to the root list. Cascading cuts maintain tree balance such that trees never become too skinny, yielding $O(1)$ amortized cost via the potential function $\Phi(H) = t(H) + 2m(H)$.

**Q7: Explain the 5 properties of a Red-Black Tree. Why is its maximum height bounded by $2\log_2(n+1)$?**
> **Answer**:
> 1. Every node is Red or Black.
> 2. Root is Black.
> 3. NIL leaves are Black.
> 4. Red nodes cannot have Red children (no consecutive red nodes).
> 5. Every root-to-NIL path has the exact same black-height $bh$.
> Because red nodes cannot be adjacent, the longest path (alternating red-black) is at most twice the length of the shortest path (all black). Hence, $h \le 2 \cdot bh \le 2\log_2(n+1)$.

**Q8: How does a B-Tree handle insertions without exceeding node capacity?**
> **Answer**: A B-Tree of minimum degree $t$ proactively splits full nodes ($2t-1$ keys) into two nodes with $t-1$ keys each during the top-down traversal, promoting the median key to the parent node. This guarantees that when an insertion reaches a leaf, the parent always has room for a new key.

---

### Category 3: Minimum Spanning Trees & Graph Algorithms

**Q9: What is the Cut Property in Minimum Spanning Trees?**
> **Answer**: For any cut $(S, V \setminus S)$ of a connected graph $G=(V,E)$, if edge $e=(u,v)$ is the minimum-weight edge crossing the cut, then $e$ belongs to every Minimum Spanning Tree of $G$.

**Q10: Contrast Prim's and Kruskal's algorithms. When is Prim preferred over Kruskal?**
> **Answer**:
> - **Prim's Algorithm**: Grows a connected tree from a starting vertex using a priority queue. Time complexity is $\Theta(E \log V)$ with a binary heap, or $\Theta(V^2)$ with an adjacency matrix.
> - **Kruskal's Algorithm**: Sorts all edges globally and uses Union-Find (DSU) to avoid cycles. Time complexity is $\Theta(E \log E) = \Theta(E \log V)$.
> - **Selection**: On dense graphs ($E \approx V^2$), matrix-based Prim ($\Theta(V^2)$) outperforms Kruskal ($\Theta(V^2 \log V)$). On sparse graphs ($E \approx V$), Kruskal is often faster and simpler to implement.

**Q11: What are Path Compression and Union by Rank in Disjoint Set Union (DSU)?**
> **Answer**:
> - **Union by Rank**: Always attaches the root of the shorter tree to the root of the taller tree, bounding tree height by $O(\log V)$.
> - **Path Compression**: Flattens the structure of the tree during `find(x)` by making every traversed node point directly to the root.
> Together, they achieve near-constant $\Theta(\alpha(V))$ amortized time per operation, where $\alpha$ is the Inverse Ackermann function.

---

### Category 4: Dynamic Programming & Knapsack

**Q12: What two essential properties must a problem have for Dynamic Programming to apply?**
> **Answer**:
> 1. **Optimal Substructure**: An optimal solution to the problem contains optimal solutions to its subproblems.
> 2. **Overlapping Subproblems**: The recursive space contains repeated subproblems that can be computed once and stored in a table (memoization or tabulation).

**Q13: Why does the Greedy method work for Fractional Knapsack but fail for 0/1 Knapsack?**
> **Answer**: Fractional Knapsack exhibits the **Greedy-Choice Property**: taking the highest value-to-weight ratio item is always part of an optimal solution because divisible capacity can be filled completely. In 0/1 Knapsack, item indivisibility can leave unfilled capacity, meaning a lower-ratio combination can yield a higher total value (e.g. $(6,12)$ vs $(5,9)+(5,9)$).

**Q14: Explain the inner loop counting formula for Matrix Chain Multiplication: $\frac{n^3 - n}{6}$.**
> **Answer**: For a chain of $n$ matrices, the subchain length $l$ ranges from $2$ to $n$. For a fixed $l$, there are $n - l + 1$ starting positions $i$, and for each $(i, j)$ pair, the split point $k$ takes $j - i = l - 1$ values. Summing over all $l$:
> $$\sum_{l=2}^{n} (n - l + 1)(l - 1) = \sum_{k=1}^{n-1} k(n-k) = \frac{(n-1)n(n+1)}{6} = \frac{n^3 - n}{6}$$
> For $n = 10$, this gives $\frac{1000 - 10}{6} = 165$ operations.

**Q15: Why is Floyd-Warshall preferred for All-Pairs Shortest Paths despite its $\Theta(V^3)$ complexity?**
> **Answer**: Floyd-Warshall is simple to implement (3 nested loops), works with negative edge weights (provided there are no negative cycles), and has excellent cache locality due to dense matrix traversal. For dense graphs, its $\Theta(V^3)$ performance matches running Dijkstra $V$ times with a Fibonacci heap ($O(V^2 \log V + V E) = O(V^3)$).

---

### Category 5: NP-Completeness, Backtracking & Branch and Bound

**Q16: What is the difference between P, NP, NP-complete, and NP-hard?**
> **Answer**:
> - **P**: Decision problems solvable in polynomial time $O(n^k)$ by a deterministic Turing machine.
> - **NP**: Decision problems whose solutions can be *verified* in polynomial time by a deterministic Turing machine.
> - **NP-complete**: Problems in NP to which every problem in NP can be reduced in polynomial time ($X \in \text{NP}$ and $\forall Y \in \text{NP}, Y \le_p X$).
> - **NP-hard**: Problems at least as hard as the hardest problems in NP. They do not have to be in NP (e.g., optimization problems like TSP Optimization).

**Q17: How does Branch and Bound differ from standard Backtracking?**
> **Answer**:
> - **Backtracking**: Depth-first search (DFS) that abandons a candidate path as soon as it violates a feasibility constraint.
> - **Branch and Bound**: Explores a state space tree by calculating mathematical **lower bounds** (for minimization) or **upper bounds** (for maximization) at each node, pruning subtrees whose bound cannot beat the best-known solution.

**Q18: Explain the bounding function used in your TSP Branch and Bound implementation.**
> **Answer**: At any state with visited path $P$ ending at city $c$ and current cost $L$:
> $$\text{Lower Bound} = L + \sum_{v \in \text{unvisited}} \min_{u \ne v} \text{dist}(v, u)$$
> If $\text{Lower Bound} \ge \text{best\_known\_cost}$, the entire subtree is pruned immediately because no completion of this tour can possibly beat the current best solution.

**Q19: What makes the "pathological" Hamiltonian graph family trigger maximum worst-case execution?**
> **Answer**: The pathological family constructs a clique $K_{n-1}$ on vertices $0 \dots n-2$, with vertex $n-1$ connected only to vertex 0. Because vertex $n-1$ has degree 1, no simple cycle visiting all vertices can exist. However, the dense clique $K_{n-1}$ provides $(n-2)!$ valid partial paths, forcing backtracking to explore every single permutation before concluding that no cycle exists.

**Q20: Why is N-Queens NOT classified as NP-complete in your Complexity Matrix?**
> **Answer**: The decision problem "Does an $n$-queens placement exist?" is trivial for all $n \ge 4$ (the answer is always YES). Explicit constructive formulas (e.g., Bernhardsson 1991) can output a valid placement in $O(n)$ deterministic time. While backtracking enumeration of *all* solutions takes $O(n!)$ time, finding one solution is in P, so the problem is not NP-complete.

---

## 4. Verification Checklists for Viva Examiners

| Algorithm | Key Invariant Checked by Code Verifier | Expected Verification Metric |
| :--- | :--- | :--- |
| **Binomial Heap** | Extractions are non-decreasing sorted | `isSorted === true` and extraction count $= n$ |
| **Fibonacci Heap** | Extractions are non-decreasing sorted | `isSorted === true` and extraction count $= n$ |
| **B-Tree ($t=3$)** | Inorder traversal is sorted & all leaves at equal depth | Inorder sorted, key count matches, `leavesDepth.size === 1` |
| **Red-Black Tree** | Root black, no consecutive red nodes, equal black-height | `rootBlack && noRedRed && blackHeightValid && isSorted` |
| **Prim's MST** | Exactly $V-1$ edges, connected, total cost matches Kruskal | `edges.length === V-1` and `primCost === kruskalCost` |
| **Kruskal's MST** | Exactly $V-1$ edges, acyclic, total cost matches Prim | `edges.length === V-1` and `kruskalCost === primCost` |
| **Fractional Knapsack** | Capacity utilized $\le C$ and optimal ratio ordering | `usedCap <= C + 1e-6` |
| **0/1 Knapsack (DP)** | Backtracked item weights $\le C$ & sum of values $= DP[n][C]$ | `totalWeight <= C && totalValue === optVal` |
| **Floyd-Warshall** | Zero diagonal & Triangle Inequality on sample triples | `dist[i][i] === 0` and `dist[i][j] <= dist[i][k] + dist[k][j]` |
| **Matrix Chain** | Split table $s[i,j]$ recomputes exact scalar multiplication cost | `recomputeCost(1, n) === m[1][n]` |
| **N-Queens** | No two queens share the same column or diagonal | `!first || (colDiff != 0 && abs(colDiff) != abs(rowDiff))` |
| **Hamiltonian Cycle** | Valid permutation of vertices $0 \dots n-1$ and valid closing edge | `set.size === n && adj[path[n-1]][0] === 1` |
| **TSP Branch & Bound** | Tour is valid permutation & sum of edge weights $= \text{bestCost}$ | `set.size === n && computedCost === bestCost` |
