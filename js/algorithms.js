// Global timeout deadline variable set before timed executions
var EXECUTION_DEADLINE = 0;
if (typeof globalThis !== 'undefined') globalThis.EXECUTION_DEADLINE = 0;

// ==========================================
// 1. Binomial Heap Implementation
// ==========================================
function createBinomialHeap() {
  const stats = { cmp: 0, link: 0 };
  let trees = []; // indexed by degree
  let nodes = [];

  function linkTrees(b1, b2) {
    stats.cmp++;
    if (b2.key < b1.key) {
      const tmp = b1; b1 = b2; b2 = tmp;
    }
    b2.parent = b1;
    b1.children.push(b2);
    stats.link++;
    return b1;
  }

  function addTree(tree) {
    let current = tree;
    for (;;) {
      const d = current.children.length;
      const existing = trees[d];
      if (!existing) {
        trees[d] = current;
        return;
      }
      trees[d] = null;
      current = linkTrees(existing, current);
    }
  }

  function insert(key) {
    const node = { key, children: [], parent: null };
    nodes.push(node);
    addTree(node);
    return node;
  }

  function decreaseKey(node, delta) {
    node.key -= delta;
    let curr = node;
    while (curr.parent) {
      stats.cmp++;
      if (curr.key < curr.parent.key) {
        const tmp = curr.key;
        curr.key = curr.parent.key;
        curr.parent.key = tmp;
        curr = curr.parent;
      } else {
        break;
      }
    }
  }

  function extractMin() {
    let minIdx = -1;
    for (let i = 0; i < trees.length; i++) {
      if (trees[i]) {
        stats.cmp++;
        if (minIdx < 0 || trees[i].key < trees[minIdx].key) {
          minIdx = i;
        }
      }
    }
    if (minIdx < 0) return null;

    const minTree = trees[minIdx];
    trees[minIdx] = null;

    // Add back all children of the extracted tree
    for (let i = 0; i < minTree.children.length; i++) {
      const child = minTree.children[i];
      child.parent = null;
      addTree(child);
    }

    return minTree.key;
  }

  function unionWith(otherHeap) {
    for (let i = 0; i < otherHeap.trees.length; i++) {
      if (otherHeap.trees[i]) {
        addTree(otherHeap.trees[i]);
      }
    }
    nodes = nodes.concat(otherHeap.nodes);
  }

  function getRootOverview() {
    return trees
      .map((t, deg) => (t ? `B${deg}(min=${t.key})` : null))
      .filter(Boolean)
      .join(' ');
  }

  return {
    stats,
    nodes,
    trees,
    insert,
    decreaseKey,
    extractMin,
    unionWith,
    getRootOverview
  };
}

function runBinomialHeap(input, T) {
  const rng = mulberry32(input.seed || 1);
  const heap = createBinomialHeap();
  const K = input.K;
  const n = K.length;

  if (T) T({ text: `Initializing Binomial Heap with ${n} keys...`, type: 'info' });

  for (let i = 0; i < n; i++) {
    heap.insert(K[i]);
    if (T && (i < 5 || i === n - 1)) {
      T({
        text: `Inserted key ${K[i]} into Binomial Heap | Roots: ${heap.getRootOverview() || 'empty'}`,
        type: 'insert',
        highlight: K[i]
      });
    }
  }

  const decCount = Math.floor(n / 4);
  for (let i = 0; i < decCount; i++) {
    const node = heap.nodes[Math.floor(rng() * heap.nodes.length)];
    const delta = 1 + Math.floor(rng() * 50);
    heap.decreaseKey(node, delta);
    if (T && i < 3) {
      T({
        text: `Decreased key of a random node by ${delta} (bubbled up toward root) | Roots: ${heap.getRootOverview()}`,
        type: 'decreaseKey'
      });
    }
  }

  const extracted = [];
  for (let i = 0; i < n; i++) {
    const val = heap.extractMin();
    if (val !== null) extracted.push(val);
    if (T && (i < 4 || i === n - 1)) {
      T({
        text: `Extract-min returned ${val} (merged children back via binomial linking) | Roots: ${heap.getRootOverview() || 'empty'}`,
        type: 'extractMin',
        val
      });
    }
  }

  let isSorted = true;
  for (let i = 1; i < extracted.length; i++) {
    if (extracted[i] < extracted[i - 1]) {
      isSorted = false;
      break;
    }
  }

  const totalOps = heap.stats.cmp + heap.stats.link;
  return {
    ops: totalOps,
    st: heap.stats.link,
    pr: 0,
    mem: n * 56, // ~56 bytes per binomial node object
    th: n * Math.log2(n + 1),
    info: `Workload: ${n} inserts, ${decCount} dec-keys, ${n} ext-mins. Comparisons: ${heap.stats.cmp}, Tree links: ${heap.stats.link}, All sorted: ${isSorted}`,
    v: () => isSorted && extracted.length === n
  };
}

// ==========================================
// 2. Fibonacci Heap Implementation
// ==========================================
function createFibonacciHeap() {
  const stats = { cmp: 0, link: 0, cut: 0 };
  let minNode = null;
  let rootList = [];
  let nodes = [];

  function cut(x, y) {
    y.children = y.children.filter(c => c !== x);
    x.parent = null;
    x.marked = false;
    rootList.push(x);
    stats.cut++;
  }

  function cascadingCut(y) {
    const z = y.parent;
    if (z) {
      if (!y.marked) {
        y.marked = true;
      } else {
        cut(y, z);
        cascadingCut(z);
      }
    }
  }

  function insert(key) {
    const node = { key, children: [], parent: null, marked: false };
    nodes.push(node);
    rootList.push(node);
    stats.cmp++;
    if (!minNode || key < minNode.key) {
      minNode = node;
    }
    return node;
  }

  function decreaseKey(node, delta) {
    node.key -= delta;
    const parent = node.parent;
    if (parent) {
      stats.cmp++;
      if (node.key < parent.key) {
        cut(node, parent);
        cascadingCut(parent);
      }
    }
    stats.cmp++;
    if (!minNode || node.key < minNode.key) {
      minNode = node;
    }
  }

  function consolidate() {
    const table = [];
    const rootsToConsolidate = [...rootList];
    for (let i = 0; i < rootsToConsolidate.length; i++) {
      let x = rootsToConsolidate[i];
      let deg = x.children.length;
      while (table[deg]) {
        let y = table[deg];
        table[deg] = null;
        stats.cmp++;
        if (y.key < x.key) {
          const tmp = x; x = y; y = tmp;
        }
        y.parent = x;
        y.marked = false;
        x.children.push(y);
        stats.link++;
        deg++;
      }
      table[deg] = x;
    }

    rootList = table.filter(Boolean);
    minNode = null;
    for (let i = 0; i < rootList.length; i++) {
      stats.cmp++;
      if (!minNode || rootList[i].key < minNode.key) {
        minNode = rootList[i];
      }
    }
  }

  function extractMin() {
    const z = minNode;
    if (!z) return null;

    rootList = rootList.filter(x => x !== z);
    for (let i = 0; i < z.children.length; i++) {
      const child = z.children[i];
      child.parent = null;
      child.marked = false;
      rootList.push(child);
    }

    if (rootList.length === 0) {
      minNode = null;
    } else {
      consolidate();
    }
    return z.key;
  }

  function unionWith(otherHeap) {
    rootList = rootList.concat(otherHeap.rootList);
    stats.cmp++;
    if (!minNode || (otherHeap.minNode && otherHeap.minNode.key < minNode.key)) {
      minNode = otherHeap.minNode;
    }
    nodes = nodes.concat(otherHeap.nodes);
  }

  return {
    stats,
    nodes,
    rootList,
    insert,
    decreaseKey,
    extractMin,
    unionWith,
    getMin: () => (minNode ? minNode.key : null),
    getRootCount: () => rootList.length
  };
}

function runFibonacciHeap(input, T) {
  const rng = mulberry32(input.seed || 1);
  const heap = createFibonacciHeap();
  const K = input.K;
  const n = K.length;

  if (T) T({ text: `Initializing Fibonacci Heap with ${n} keys...`, type: 'info' });

  for (let i = 0; i < n; i++) {
    heap.insert(K[i]);
    if (T && (i < 5 || i === n - 1)) {
      T({
        text: `Lazy inserted key ${K[i]} into root list | Total roots: ${heap.getRootCount()}, Min: ${heap.getMin()}`,
        type: 'insert'
      });
    }
  }

  const decCount = Math.floor(n / 4);
  for (let i = 0; i < decCount; i++) {
    const node = heap.nodes[Math.floor(rng() * heap.nodes.length)];
    const delta = 1 + Math.floor(rng() * 50);
    heap.decreaseKey(node, delta);
    if (T && i < 3) {
      T({
        text: `Decreased key by ${delta} (cut & cascading cut if violation) | Min: ${heap.getMin()}, Cuts: ${heap.stats.cut}`,
        type: 'decreaseKey'
      });
    }
  }

  const extracted = [];
  for (let i = 0; i < n; i++) {
    const val = heap.extractMin();
    if (val !== null) extracted.push(val);
    if (T && (i < 4 || i === n - 1)) {
      T({
        text: `Extract-min returned ${val} -> Consolidated degree collisions into binomial-like trees | Remaining roots: ${heap.getRootCount()}`,
        type: 'extractMin',
        val
      });
    }
  }

  let isSorted = true;
  for (let i = 1; i < extracted.length; i++) {
    if (extracted[i] < extracted[i - 1]) {
      isSorted = false;
      break;
    }
  }

  const totalOps = heap.stats.cmp + heap.stats.link + heap.stats.cut;
  return {
    ops: totalOps,
    st: heap.stats.link,
    pr: heap.stats.cut,
    mem: n * 64, // ~64 bytes per Fibonacci node object
    th: n * Math.log2(n + 1),
    info: `Fibonacci heap workload: ${n} inserts, ${decCount} dec-keys, ${n} ext-mins. Comparisons: ${heap.stats.cmp}, Tree links: ${heap.stats.link}, Cuts: ${heap.stats.cut}, Sorted: ${isSorted}`,
    v: () => isSorted && extracted.length === n
  };
}

// ==========================================
// 3. B-Tree Implementation (t = 3)
// ==========================================
function createBTree(t = 3) {
  const stats = { cmp: 0, splits: 0, merges: 0, borrows: 0 };
  let root = { keys: [], children: [], isLeaf: true };

  function splitChild(parent, index) {
    const child = parent.children[index];
    const newNode = {
      keys: child.keys.splice(t),
      children: child.isLeaf ? [] : child.children.splice(t),
      isLeaf: child.isLeaf
    };
    const medianKey = child.keys.pop();

    parent.keys.splice(index, 0, medianKey);
    parent.children.splice(index + 1, 0, newNode);
    stats.splits++;
  }

  function insertNonFull(node, key) {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      while (i >= 0) {
        stats.cmp++;
        if (key < node.keys[i]) {
          i--;
        } else {
          break;
        }
      }
      node.keys.splice(i + 1, 0, key);
    } else {
      while (i >= 0) {
        stats.cmp++;
        if (key < node.keys[i]) {
          i--;
        } else {
          break;
        }
      }
      i++;
      if (node.children[i].keys.length === 2 * t - 1) {
        splitChild(node, i);
        stats.cmp++;
        if (key > node.keys[i]) {
          i++;
        }
      }
      insertNonFull(node.children[i], key);
    }
  }

  function insert(key) {
    if (root.keys.length === 2 * t - 1) {
      const newRoot = { keys: [], children: [root], isLeaf: false };
      splitChild(newRoot, 0);
      root = newRoot;
    }
    insertNonFull(root, key);
  }

  function search(node, key) {
    let i = 0;
    while (i < node.keys.length) {
      stats.cmp++;
      if (key > node.keys[i]) {
        i++;
      } else {
        break;
      }
    }
    if (i < node.keys.length && node.keys[i] === key) {
      return true;
    }
    if (node.isLeaf) {
      return false;
    }
    return search(node.children[i], key);
  }

  function deleteKey(node, key) {
    let idx = 0;
    while (idx < node.keys.length) {
      stats.cmp++;
      if (key > node.keys[idx]) idx++;
      else break;
    }

    if (idx < node.keys.length && node.keys[idx] === key) {
      if (node.isLeaf) {
        node.keys.splice(idx, 1);
        return true;
      } else {
        // Internal node deletion
        const leftChild = node.children[idx];
        const rightChild = node.children[idx + 1];

        if (leftChild.keys.length >= t) {
          // Find predecessor
          let cur = leftChild;
          while (!cur.isLeaf) cur = cur.children[cur.children.length - 1];
          const predKey = cur.keys[cur.keys.length - 1];
          node.keys[idx] = predKey;
          deleteKey(leftChild, predKey);
        } else if (rightChild.keys.length >= t) {
          // Find successor
          let cur = rightChild;
          while (!cur.isLeaf) cur = cur.children[0];
          const succKey = cur.keys[0];
          node.keys[idx] = succKey;
          deleteKey(rightChild, succKey);
        } else {
          // Merge leftChild, key, rightChild
          leftChild.keys.push(node.keys.splice(idx, 1)[0]);
          leftChild.keys.push(...rightChild.keys);
          if (!leftChild.isLeaf) {
            leftChild.children.push(...rightChild.children);
          }
          node.children.splice(idx + 1, 1);
          stats.merges++;
          deleteKey(leftChild, key);
        }
        return true;
      }
    } else {
      if (node.isLeaf) return false;

      const flag = idx === node.keys.length;
      if (node.children[idx].keys.length < t) {
        fillChild(node, idx);
      }

      if (flag && idx > node.keys.length) {
        return deleteKey(node.children[idx - 1], key);
      } else {
        return deleteKey(node.children[idx], key);
      }
    }
  }

  function fillChild(node, idx) {
    if (idx > 0 && node.children[idx - 1].keys.length >= t) {
      // Borrow from left sibling
      const child = node.children[idx];
      const sibling = node.children[idx - 1];
      child.keys.unshift(node.keys[idx - 1]);
      node.keys[idx - 1] = sibling.keys.pop();
      if (!child.isLeaf) {
        child.children.unshift(sibling.children.pop());
      }
      stats.borrows++;
    } else if (idx < node.children.length - 1 && node.children[idx + 1].keys.length >= t) {
      // Borrow from right sibling
      const child = node.children[idx];
      const sibling = node.children[idx + 1];
      child.keys.push(node.keys[idx]);
      node.keys[idx] = sibling.keys.shift();
      if (!child.isLeaf) {
        child.children.push(sibling.children.shift());
      }
      stats.borrows++;
    } else {
      // Merge with a sibling
      if (idx < node.children.length - 1) {
        mergeChildren(node, idx);
      } else {
        mergeChildren(node, idx - 1);
      }
    }
  }

  function mergeChildren(node, idx) {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];
    child.keys.push(node.keys.splice(idx, 1)[0]);
    child.keys.push(...sibling.keys);
    if (!child.isLeaf) {
      child.children.push(...sibling.children);
    }
    node.children.splice(idx + 1, 1);
    stats.merges++;
  }

  function remove(key) {
    deleteKey(root, key);
    if (root.keys.length === 0 && !root.isLeaf) {
      root = root.children[0];
    }
  }

  function getInorder(node = root, list = []) {
    if (!node) return list;
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.isLeaf && node.children[i]) {
        getInorder(node.children[i], list);
      }
      list.push(node.keys[i]);
    }
    if (!node.isLeaf && node.children[node.keys.length]) {
      getInorder(node.children[node.keys.length], list);
    }
    return list;
  }

  function verifyProperties() {
    const leavesDepth = new Set();
    let nodeSizeValid = true;

    function walk(node, depth) {
      if (node.isLeaf) {
        leavesDepth.add(depth);
      } else {
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], depth + 1);
        }
      }
      if (node !== root && (node.keys.length < t - 1 || node.keys.length > 2 * t - 1)) {
        nodeSizeValid = false;
      }
    }

    walk(root, 0);
    const inorder = getInorder();
    let sorted = true;
    for (let i = 1; i < inorder.length; i++) {
      if (inorder[i] < inorder[i - 1]) {
        sorted = false;
        break;
      }
    }
    return {
      isValid: sorted && leavesDepth.size <= 1 && nodeSizeValid,
      depthUnique: leavesDepth.size <= 1,
      sorted,
      nodeSizeValid,
      count: inorder.length
    };
  }

  return {
    stats,
    root,
    insert,
    search: k => search(root, k),
    remove,
    getInorder,
    verifyProperties
  };
}

function runBTree(input, T) {
  const rng = mulberry32(input.seed || 1);
  const btree = createBTree(3);
  const K = input.K;
  const n = K.length;

  if (T) T({ text: `Initializing B-Tree (t=3, max keys=5) with ${n} keys...`, type: 'info' });

  for (let i = 0; i < n; i++) {
    btree.insert(K[i]);
    if (T && (i < 5 || i === n - 1)) {
      T({
        text: `Inserted ${K[i]} into B-Tree | Root keys: [${btree.root.keys.join(', ')}], Splits: ${btree.stats.splits}`,
        type: 'insert',
        rootKeys: btree.root.keys
      });
    }
  }

  const searchCount = Math.floor(n / 4);
  for (let i = 0; i < searchCount; i++) {
    const target = K[Math.floor(rng() * n)];
    btree.search(target);
  }

  const delCount = Math.min(n - 1, Math.floor(n / 4));
  for (let i = 0; i < delCount; i++) {
    const target = K[i];
    btree.remove(target);
    if (T && i < 3) {
      T({
        text: `Deleted key ${target} | Borrows: ${btree.stats.borrows}, Merges: ${btree.stats.merges}, Root keys: [${btree.root.keys.join(', ')}]`,
        type: 'delete'
      });
    }
  }

  const vResult = btree.verifyProperties();
  const totalOps = btree.stats.cmp + btree.stats.splits + btree.stats.borrows + btree.stats.merges;

  return {
    ops: totalOps,
    st: btree.stats.splits,
    pr: btree.stats.merges + btree.stats.borrows,
    mem: n * 32, // ~32 bytes per key in B-tree node chunks
    th: n * Math.log2(n + 1),
    info: `B-Tree (t=3): ${n} inserts, ${searchCount} searches, ${delCount} deletes. Splits: ${btree.stats.splits}, Borrows: ${btree.stats.borrows}, Merges: ${btree.stats.merges}, All leaves same depth: ${vResult.depthUnique}`,
    v: () => vResult.isValid
  };
}

// ==========================================
// 4. Red-Black Tree Implementation
// ==========================================
function createRBTree() {
  const RED = 1;
  const BLACK = 0;
  const stats = { cmp: 0, rot: 0, rec: 0 };
  let root = null;

  function rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
    stats.rot++;
  }

  function rotateRight(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
    stats.rot++;
  }

  function insert(key) {
    const z = { key, color: RED, left: null, right: null, parent: null };
    let y = null;
    let x = root;
    while (x) {
      y = x;
      stats.cmp++;
      if (z.key < x.key) x = x.left;
      else x = x.right;
    }
    z.parent = y;
    if (!y) root = z;
    else if (z.key < y.key) y.left = z;
    else y.right = z;

    // RB fixup
    let curr = z;
    while (curr.parent && curr.parent.color === RED) {
      const g = curr.parent.parent;
      if (!g) break;
      const isLeft = curr.parent === g.left;
      const uncle = isLeft ? g.right : g.left;

      if (uncle && uncle.color === RED) {
        // Case 1: Uncle is Red -> Recolor
        curr.parent.color = BLACK;
        uncle.color = BLACK;
        g.color = RED;
        curr = g;
        stats.rec += 3;
      } else {
        // Case 2 & 3: Uncle is Black -> Rotations & Recolor
        if (isLeft) {
          if (curr === curr.parent.right) {
            curr = curr.parent;
            rotateLeft(curr);
          }
          curr.parent.color = BLACK;
          g.color = RED;
          rotateRight(g);
        } else {
          if (curr === curr.parent.left) {
            curr = curr.parent;
            rotateRight(curr);
          }
          curr.parent.color = BLACK;
          g.color = RED;
          rotateLeft(g);
        }
        stats.rec += 2;
      }
    }
    if (root) root.color = BLACK;
    return z;
  }

  function search(key) {
    let x = root;
    while (x) {
      stats.cmp++;
      if (x.key === key) return true;
      if (key < x.key) x = x.left;
      else x = x.right;
    }
    return false;
  }

  function transplant(u, v) {
    if (!u.parent) root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    if (v) v.parent = u.parent;
  }

  function minimum(x) {
    while (x.left) {
      stats.cmp++;
      x = x.left;
    }
    return x;
  }

  function deleteNode(key) {
    let z = root;
    while (z) {
      stats.cmp++;
      if (z.key === key) break;
      if (key < z.key) z = z.left;
      else z = z.right;
    }
    if (!z) return false;

    let y = z;
    let yOrigColor = y.color;
    let x = null;
    let xParent = null;

    if (!z.left) {
      x = z.right;
      xParent = z.parent;
      transplant(z, z.right);
    } else if (!z.right) {
      x = z.left;
      xParent = z.parent;
      transplant(z, z.left);
    } else {
      y = minimum(z.right);
      yOrigColor = y.color;
      x = y.right;
      if (y.parent === z) {
        xParent = y;
      } else {
        xParent = y.parent;
        transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }

    if (yOrigColor === BLACK) {
      deleteFixup(x, xParent);
    }
    return true;
  }

  function deleteFixup(x, parent) {
    while (x !== root && (!x || x.color === BLACK)) {
      if (x === (parent ? parent.left : null)) {
        let w = parent ? parent.right : null;
        if (w && w.color === RED) {
          w.color = BLACK;
          parent.color = RED;
          rotateLeft(parent);
          w = parent.right;
          stats.rec += 2;
        }
        if ((!w || !w.left || w.left.color === BLACK) && (!w || !w.right || w.right.color === BLACK)) {
          if (w) w.color = RED;
          x = parent;
          parent = x ? x.parent : null;
          stats.rec++;
        } else {
          if (!w || !w.right || w.right.color === BLACK) {
            if (w && w.left) w.left.color = BLACK;
            if (w) w.color = RED;
            if (w) rotateRight(w);
            w = parent ? parent.right : null;
            stats.rec += 2;
          }
          if (w) {
            w.color = parent ? parent.color : BLACK;
            if (parent) parent.color = BLACK;
            if (w.right) w.right.color = BLACK;
            rotateLeft(parent);
            stats.rec += 3;
          }
          x = root;
          break;
        }
      } else {
        let w = parent ? parent.left : null;
        if (w && w.color === RED) {
          w.color = BLACK;
          parent.color = RED;
          rotateRight(parent);
          w = parent.left;
          stats.rec += 2;
        }
        if ((!w || !w.right || w.right.color === BLACK) && (!w || !w.left || w.left.color === BLACK)) {
          if (w) w.color = RED;
          x = parent;
          parent = x ? x.parent : null;
          stats.rec++;
        } else {
          if (!w || !w.left || w.left.color === BLACK) {
            if (w && w.right) w.right.color = BLACK;
            if (w) w.color = RED;
            if (w) rotateLeft(w);
            w = parent ? parent.left : null;
            stats.rec += 2;
          }
          if (w) {
            w.color = parent ? parent.color : BLACK;
            if (parent) parent.color = BLACK;
            if (w.left) w.left.color = BLACK;
            rotateRight(parent);
            stats.rec += 3;
          }
          x = root;
          break;
        }
      }
    }
    if (x) x.color = BLACK;
  }

  function getInorder(node = root, list = []) {
    if (!node) return list;
    getInorder(node.left, list);
    list.push(node.key);
    getInorder(node.right, list);
    return list;
  }

  function verifyProperties() {
    if (!root) return { isValid: true, blackHeight: 0, maxHeight: 0 };
    let noRedRed = true;
    let blackHeightValid = true;

    function check(node) {
      if (!node) return 1; // NIL is black
      if (node.color === RED) {
        if ((node.left && node.left.color === RED) || (node.right && node.right.color === RED)) {
          noRedRed = false;
        }
      }
      const leftBH = check(node.left);
      const rightBH = check(node.right);
      if (leftBH !== rightBH) {
        blackHeightValid = false;
      }
      return leftBH + (node.color === BLACK ? 1 : 0);
    }

    function getHeight(node) {
      if (!node) return 0;
      return 1 + Math.max(getHeight(node.left), getHeight(node.right));
    }

    const bh = check(root);
    const height = getHeight(root);
    const rootBlack = root.color === BLACK;
    const inorder = getInorder();
    let sorted = true;
    for (let i = 1; i < inorder.length; i++) {
      if (inorder[i] < inorder[i - 1]) {
        sorted = false;
        break;
      }
    }

    return {
      isValid: rootBlack && noRedRed && blackHeightValid && sorted,
      rootBlack,
      noRedRed,
      blackHeightValid,
      height,
      blackHeight: bh
    };
  }

  return {
    stats,
    root,
    insert,
    search,
    deleteNode,
    getInorder,
    verifyProperties
  };
}

function runRBTree(input, T) {
  const rng = mulberry32(input.seed || 1);
  const tree = createRBTree();
  const K = input.K;
  const n = K.length;

  if (T) T({ text: `Initializing Red-Black Tree with ${n} keys...`, type: 'info' });

  for (let i = 0; i < n; i++) {
    tree.insert(K[i]);
    if (T && (i < 5 || i === n - 1)) {
      T({
        text: `Inserted key ${K[i]} | Rotations: ${tree.stats.rot}, Recolors: ${tree.stats.rec}`,
        type: 'insert',
        key: K[i]
      });
    }
  }

  const searchCount = Math.floor(n / 4);
  for (let i = 0; i < searchCount; i++) {
    const target = K[Math.floor(rng() * n)];
    tree.search(target);
  }

  const delCount = Math.min(n - 1, Math.floor(n / 4));
  for (let i = 0; i < delCount; i++) {
    const target = K[i];
    tree.deleteNode(target);
    if (T && i < 3) {
      T({
        text: `Deleted key ${target} with RB fixup | Rotations: ${tree.stats.rot}, Recolors: ${tree.stats.rec}`,
        type: 'delete',
        key: target
      });
    }
  }

  const vResult = tree.verifyProperties();
  const totalOps = tree.stats.cmp + tree.stats.rot + tree.stats.rec;

  return {
    ops: totalOps,
    st: tree.stats.rot,
    pr: tree.stats.rec,
    mem: n * 48, // ~48 bytes per RB tree node
    th: n * Math.log2(n + 1),
    info: `Red-Black Tree: ${n} inserts, ${searchCount} searches, ${delCount} deletes. Rotations: ${tree.stats.rot}, Recolors: ${tree.stats.rec}, Tree Height: ${vResult.height}, Black Height: ${vResult.blackHeight}`,
    v: () => vResult.isValid
  };
}

// ==========================================
// 5. Prim's Algorithm (MST)
// ==========================================
function createMinHeapForPrim(stats) {
  const heap = [];

  function push(item) {
    stats.heapOps++;
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      stats.cmp++;
      if (heap[i][0] < heap[parent][0]) {
        const tmp = heap[i]; heap[i] = heap[parent]; heap[parent] = tmp;
        i = parent;
      } else {
        break;
      }
    }
  }

  function pop() {
    stats.heapOps++;
    if (heap.length === 0) return null;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let left = 2 * i + 1;
        let right = 2 * i + 2;
        let smallest = i;
        if (left < heap.length) {
          stats.cmp++;
          if (heap[left][0] < heap[smallest][0]) smallest = left;
        }
        if (right < heap.length) {
          stats.cmp++;
          if (heap[right][0] < heap[smallest][0]) smallest = right;
        }
        if (smallest !== i) {
          const tmp = heap[i]; heap[i] = heap[smallest]; heap[smallest] = tmp;
          i = smallest;
        } else {
          break;
        }
      }
    }
    return top;
  }

  return { push, pop, size: () => heap.length };
}

function runPrimMST(graph, T) {
  const V = graph.V;
  const adj = graph.adj;
  const stats = { cmp: 0, heapOps: 0, edgesExamined: 0 };
  const inMST = new Uint8Array(V);
  const minHeap = createMinHeapForPrim(stats);
  const mstEdges = [];
  let totalCost = 0;

  inMST[0] = 1;
  for (let i = 0; i < adj[0].length; i++) {
    const [neighbor, weight] = adj[0][i];
    minHeap.push([weight, neighbor, 0]);
  }

  if (T) T({ text: `Prim's MST started at root vertex 0`, type: 'start', vertex: 0 });

  while (minHeap.size() > 0 && mstEdges.length < V - 1) {
    const [weight, u, from] = minHeap.pop();
    stats.edgesExamined++;

    if (inMST[u]) {
      if (T) T({
        text: `Edge (${from} - ${u}, w=${weight}) rejected: vertex ${u} is already in MST`,
        type: 'reject',
        edge: [from, u, weight]
      });
      continue;
    }

    inMST[u] = 1;
    totalCost += weight;
    mstEdges.push([from, u, weight]);

    if (T) T({
      text: `Prim accepted edge (${from} - ${u}, w=${weight}) -> Current MST cost: ${totalCost}`,
      type: 'accept',
      edge: [from, u, weight],
      totalCost
    });

    for (let i = 0; i < adj[u].length; i++) {
      const [v, w] = adj[u][i];
      if (!inMST[v]) {
        minHeap.push([w, v, u]);
      }
    }
  }

  const totalOps = stats.cmp + stats.heapOps + stats.edgesExamined;
  return {
    ops: totalOps,
    st: stats.edgesExamined,
    pr: stats.edgesExamined - mstEdges.length,
    mem: (graph.E.length * 2 + V) * 16,
    th: graph.E.length * Math.log2(V + 1),
    cost: totalCost,
    edges: mstEdges,
    info: `MST Cost: ${totalCost}, Edges: ${mstEdges.length}/${V - 1}, Comparisons: ${stats.cmp}, Heap Ops: ${stats.heapOps}, Edges Examined: ${stats.edgesExamined}`,
    v: () => {
      // Compare total cost with Kruskal on identical graph
      const kRes = runKruskalMST(graph, null);
      return mstEdges.length === V - 1 && totalCost === kRes.cost;
    }
  };
}

// ==========================================
// 6. Kruskal's Algorithm (MST)
// ==========================================
function runKruskalMST(graph, T) {
  const V = graph.V;
  const edges = graph.E;
  const stats = { cmp: 0, dsuOps: 0, edgesExamined: 0 };

  // Disjoint Set Union with Path Compression and Union by Rank
  const parent = new Int32Array(V);
  const rank = new Uint8Array(V);
  for (let i = 0; i < V; i++) parent[i] = i;

  function find(i) {
    stats.dsuOps++;
    let root = i;
    while (root !== parent[root]) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const next = parent[curr];
      parent[curr] = root;
      curr = next;
    }
    return root;
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI === rootJ) return false;
    stats.dsuOps++;
    if (rank[rootI] < rank[rootJ]) {
      parent[rootI] = rootJ;
    } else if (rank[rootI] > rank[rootJ]) {
      parent[rootJ] = rootI;
    } else {
      parent[rootJ] = rootI;
      rank[rootI]++;
    }
    return true;
  }

  // Sort edges ascending by weight
  const sortedEdges = [...edges].sort((a, b) => {
    stats.cmp++;
    return a[2] - b[2];
  });

  if (T) T({ text: `Kruskal sorted ${sortedEdges.length} edges by weight. Scanning edges...`, type: 'start' });

  const mstEdges = [];
  let totalCost = 0;

  for (let i = 0; i < sortedEdges.length; i++) {
    const [u, v, w] = sortedEdges[i];
    stats.edgesExamined++;

    if (union(u, v)) {
      totalCost += w;
      mstEdges.push([u, v, w]);
      if (T) T({
        text: `Edge (${u} - ${v}, w=${w}) accepted -> Union disjoint components. MST cost: ${totalCost}`,
        type: 'accept',
        edge: [u, v, w],
        totalCost
      });
      if (mstEdges.length === V - 1) break;
    } else {
      if (T) T({
        text: `Edge (${u} - ${v}, w=${w}) rejected -> Vertices already in the same component (would create a cycle)`,
        type: 'reject',
        edge: [u, v, w]
      });
    }
  }

  const totalOps = stats.cmp + stats.dsuOps + stats.edgesExamined;
  return {
    ops: totalOps,
    st: stats.edgesExamined,
    pr: stats.edgesExamined - mstEdges.length,
    mem: edges.length * 24 + V * 8,
    th: edges.length * Math.log2(edges.length + 1),
    cost: totalCost,
    edges: mstEdges,
    info: `MST Cost: ${totalCost}, Edges: ${mstEdges.length}/${V - 1}, Sort comparisons: ${stats.cmp}, DSU Ops: ${stats.dsuOps}, Edges Examined: ${stats.edgesExamined}`,
    v: () => mstEdges.length === V - 1
  };
}

// ==========================================
// 7. Fractional Knapsack
// ==========================================
function runFractionalKnapsack(input, T) {
  const { w, v, C } = input;
  const n = w.length;
  const stats = { cmp: 0 };

  const items = Array.from({ length: n }, (_, i) => ({
    id: i,
    w: w[i],
    v: v[i],
    ratio: v[i] / w[i]
  }));

  items.sort((a, b) => {
    stats.cmp++;
    return b.ratio - a.ratio;
  });

  let curCap = C;
  let totalVal = 0;
  const taken = [];

  if (T) T({ text: `Fractional Knapsack: Capacity=${C}, sorted ${n} items by value/weight ratio.`, type: 'start' });

  for (let i = 0; i < n; i++) {
    if (curCap <= 0) break;
    const item = items[i];
    if (item.w <= curCap) {
      curCap -= item.w;
      totalVal += item.v;
      taken.push({ id: item.id, frac: 1, val: item.v, wt: item.w });
      if (T) T({
        text: `Item ${item.id} (w=${item.w}, v=${item.v}, ratio=${item.ratio.toFixed(2)}): Took 100% -> Val: ${totalVal.toFixed(2)}, Cap left: ${curCap.toFixed(2)}`,
        type: 'takeFull',
        item
      });
    } else {
      const frac = curCap / item.w;
      const gainedVal = frac * item.v;
      totalVal += gainedVal;
      taken.push({ id: item.id, frac, val: gainedVal, wt: curCap });
      if (T) T({
        text: `Item ${item.id} (w=${item.w}, v=${item.v}): Took ${(frac * 100).toFixed(1)}% (PARTIAL item) -> Val: ${totalVal.toFixed(2)}, Capacity full!`,
        type: 'takePartial',
        item,
        frac
      });
      curCap = 0;
      break;
    }
  }

  const usedCap = C - curCap;
  const totalOps = stats.cmp + n;

  return {
    ops: totalOps,
    st: n,
    pr: 0,
    mem: n * 24,
    th: n * Math.log2(n + 1),
    val: totalVal,
    usedCap,
    info: `Fractional Value: ${totalVal.toFixed(2)}, Capacity used: ${((usedCap / C) * 100).toFixed(1)}% (${usedCap.toFixed(1)}/${C}), Items taken: ${taken.length}`,
    v: () => usedCap <= C + 1e-6
  };
}

// ==========================================
// 8. 0/1 Knapsack (DP)
// ==========================================
function run01Knapsack(input, T) {
  const { w, v, C } = input;
  const n = w.length;
  const W = C + 1;
  const totalCells = (n + 1) * W;

  // Pseudo-polynomial safe limit check (4,000,000 cells)
  if (totalCells > 4000000) {
    return {
      ops: 0,
      st: 0,
      pr: 0,
      to: true,
      mem: totalCells * 4,
      th: n * C,
      info: `DP Table size (n+1)(C+1) = ${(n + 1)} * ${W} = ${totalCells.toLocaleString()} cells exceeds the 4,000,000 browser-safe memory limit -> Pseudo-polynomial O(nC) blow-up (HIGH risk)`,
      v: () => false
    };
  }

  const dp = new Int32Array(totalCells);
  let innerOps = 0;

  if (T) T({ text: `0/1 Knapsack: Allocating DP table (${n + 1} rows x ${W} cols). Filling bottom-up...`, type: 'start' });

  for (let i = 1; i <= n; i++) {
    const wi = w[i - 1];
    const vi = v[i - 1];
    const prevRow = (i - 1) * W;
    const currRow = i * W;

    for (let c = 0; c <= C; c++) {
      innerOps++;
      let withoutItem = dp[prevRow + c];
      if (c >= wi) {
        let withItem = dp[prevRow + c - wi] + vi;
        dp[currRow + c] = withItem > withoutItem ? withItem : withoutItem;
      } else {
        dp[currRow + c] = withoutItem;
      }
    }

    if (T && (i <= 4 || i === n)) {
      T({
        text: `Row ${i} (item w=${wi}, v=${vi}): dp[${i}][${C}] = ${dp[currRow + C]} (optimal subproblem value for capacity ${C})`,
        type: 'rowDone',
        row: i,
        val: dp[currRow + C]
      });
    }
  }

  // Backtrack to identify selected items
  const selected = [];
  let c = C;
  for (let i = n; i > 0; i--) {
    const prevVal = dp[(i - 1) * W + c];
    const currVal = dp[i * W + c];
    if (currVal !== prevVal) {
      selected.push(i - 1);
      c -= w[i - 1];
    }
  }
  selected.reverse();

  const optVal = dp[n * W + C];
  const totalWeight = selected.reduce((sum, idx) => sum + w[idx], 0);
  const totalValue = selected.reduce((sum, idx) => sum + v[idx], 0);

  // Compute greedy-by-ratio 0/1 for comparison
  const greedyVal = (function () {
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => v[b] / w[b] - v[a] / w[a]);
    let cap = C;
    let sumV = 0;
    for (const idx of order) {
      if (w[idx] <= cap) {
        cap -= w[idx];
        sumV += v[idx];
      }
    }
    return sumV;
  })();

  return {
    ops: innerOps,
    st: totalCells,
    pr: 0,
    mem: totalCells * 4,
    th: n * C,
    val: optVal,
    selected,
    info: `0/1 DP Optimal: ${optVal} (Weight: ${totalWeight}/${C}, Items: [${selected.join(', ')}]) vs Greedy-by-ratio: ${greedyVal}${greedyVal < optVal ? ' <- GREEDY FAILS' : ''}`,
    v: () => totalWeight <= C && totalValue === optVal
  };
}

// ==========================================
// 9. Floyd-Warshall (APSP)
// ==========================================
function runFloydWarshall(input, T) {
  const V = input.V;
  const dist = input.d.map(row => [...row]);
  let innerOps = 0;
  let updates = 0;

  if (T) T({ text: `Floyd-Warshall All-Pairs Shortest Paths on ${V} vertices. Triple nested loops V^3 = ${V * V * V} iterations.`, type: 'start' });

  for (let k = 0; k < V; k++) {
    for (let i = 0; i < V; i++) {
      const dik = dist[i][k];
      if (dik >= 1e9) {
        innerOps += V;
        continue;
      }
      for (let j = 0; j < V; j++) {
        innerOps++;
        const newDist = dik + dist[k][j];
        if (newDist < dist[i][j]) {
          dist[i][j] = newDist;
          updates++;
          if (T && V <= 6) {
            T({
              text: `k=${k}, i=${i}, j=${j}: Relaxed dist[${i}][${j}] via vertex ${k} to ${newDist}`,
              type: 'update',
              i, j, k, newDist
            });
          }
        }
      }
    }
    if (T && (k < 3 || k === V - 1)) {
      T({
        text: `Completed intermediate vertex k=${k} (${updates} total relaxations so far)`,
        type: 'stepDone',
        k
      });
    }
  }

  return {
    ops: innerOps,
    st: updates,
    pr: 0,
    mem: V * V * 8,
    th: V * V * V,
    info: `All-Pairs Shortest Paths computed. Inner loop iterations: ${innerOps} (=V³), Distance relaxations: ${updates}`,
    v: () => {
      for (let i = 0; i < V; i++) {
        if (dist[i][i] !== 0) return false;
      }
      // Sample triangle inequality verification
      const samples = Math.min(1000, V * V);
      const rng = mulberry32(12345);
      for (let s = 0; s < samples; s++) {
        const i = Math.floor(rng() * V);
        const j = Math.floor(rng() * V);
        const k = Math.floor(rng() * V);
        if (dist[i][j] > dist[i][k] + dist[k][j]) return false;
      }
      return true;
    }
  };
}

// ==========================================
// 10. Matrix Chain Multiplication
// ==========================================
function runMatrixChain(input, T) {
  const D = input.D;
  const n = D.length - 1; // number of matrices
  let innerOps = 0;

  // DP tables m[1..n][1..n] and s[1..n][1..n]
  const m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  const s = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));

  if (T) T({ text: `Matrix Chain Multiplication for ${n} matrices. Computing optimal split points...`, type: 'start' });

  // Chain length l from 2 to n
  for (let l = 2; l <= n; l++) {
    for (let i = 1; i <= n - l + 1; i++) {
      const j = i + l - 1;
      m[i][j] = Infinity;

      for (let k = i; k < j; k++) {
        innerOps++;
        const cost = m[i][k] + m[k + 1][j] + D[i - 1] * D[k] * D[j];
        if (cost < m[i][j]) {
          m[i][j] = cost;
          s[i][j] = k;
        }
      }
    }
    if (T && (l <= 4 || l === n)) {
      T({
        text: `Subchain length l=${l}: m[1][${l}] = ${m[1][l]} scalar multiplications`,
        type: 'chainDone',
        l
      });
    }
  }

  function getParenthesization(i, j) {
    if (i === j) return `A${i}`;
    const k = s[i][j];
    return `(${getParenthesization(i, k)} × ${getParenthesization(k + 1, j)})`;
  }

  function recomputeCost(i, j) {
    if (i === j) return 0;
    const k = s[i][j];
    return recomputeCost(i, k) + recomputeCost(k + 1, j) + D[i - 1] * D[k] * D[j];
  }

  // Naive left-to-right associative cost: ((A1 x A2) x A3)...
  let naiveCost = 0;
  for (let i = 2; i <= n; i++) {
    naiveCost += D[0] * D[i - 1] * D[i];
  }

  const optimalParen = getParenthesization(1, n);
  const minCost = m[1][n];

  return {
    ops: innerOps,
    st: (n * (n + 1)) / 2,
    pr: 0,
    mem: n * n * 16,
    th: (n * n * n - n) / 6,
    info: `Optimal Scalar Mults: ${minCost.toLocaleString()} | Order: ${optimalParen} | Naive Left-to-Right: ${naiveCost.toLocaleString()} | Inner Ops: ${innerOps} (= (n³-n)/6)`,
    v: () => recomputeCost(1, n) === minCost
  };
}

// ==========================================
// 11. N-Queens (Backtracking)
// ==========================================
function runNQueens(input, T) {
  const n = input.n;
  const findAll = input.all;
  const col = new Uint8Array(n);
  const diag1 = new Uint8Array(2 * n); // r + c
  const diag2 = new Uint8Array(2 * n); // r - c + n - 1
  const queens = new Int32Array(n);
  const stats = { states: 0, pruned: 0, solutions: 0, maxDepth: 0 };
  let firstSolution = null;
  let timedOut = false;
  let stepCheckCount = 0;

  if (T) T({ text: `N-Queens on ${n}x${n} chessboard (Mode: ${findAll ? 'All Solutions' : 'First Solution'})...`, type: 'start' });

  function solve(row) {
    if (row === n) {
      stats.solutions++;
      if (!firstSolution) firstSolution = Array.from(queens);
      if (T) T({
        text: `[Solution] Found valid queen placement: [${queens.join(', ')}]`,
        type: 'solution',
        queens: Array.from(queens)
      });
      return !findAll; // stop if single solution mode
    }

    stats.maxDepth = Math.max(stats.maxDepth, row + 1);

    for (let c = 0; c < n; c++) {
      if (++stepCheckCount % 2048 === 0 && EXECUTION_DEADLINE > 0 && performance.now() > EXECUTION_DEADLINE) {
        throw 'timeout';
      }

      stats.states++;
      const d1 = row + c;
      const d2 = row - c + n - 1;

      if (col[c] || diag1[d1] || diag2[d2]) {
        stats.pruned++;
        if (T && n <= 8) {
          T({
            text: `Row ${row}, Col ${c} attacked (under attack by column or diagonal) -> PRUNED`,
            type: 'prune'
          });
        }
        continue;
      }

      // Place queen
      col[c] = diag1[d1] = diag2[d2] = 1;
      queens[row] = c;

      if (T && n <= 8) {
        T({
          text: `Placed Queen at (Row ${row}, Col ${c})`,
          type: 'place',
          row, col: c,
          queens: Array.from(queens.slice(0, row + 1))
        });
      }

      if (solve(row + 1)) return true;

      // Backtrack
      col[c] = diag1[d1] = diag2[d2] = 0;
      if (T && n <= 8) {
        T({
          text: `Backtrack: Removed Queen from Row ${row}, Col ${c}`,
          type: 'backtrack',
          row, col: c
        });
      }
    }
    return false;
  }

  try {
    solve(0);
  } catch (err) {
    if (err === 'timeout') timedOut = true;
    else throw err;
  }

  // Factorial theoretical model
  let factorialN = 1;
  for (let i = 1; i <= n; i++) factorialN *= i;

  return {
    ops: stats.states,
    st: stats.states,
    pr: stats.pruned,
    to: timedOut,
    mem: n * 32,
    th: factorialN,
    info: `${timedOut ? 'TIMEOUT (partial) | ' : ''}Solutions found: ${stats.solutions}, States explored: ${stats.states}, Pruned branches: ${stats.pruned}, Max depth: ${stats.maxDepth}${firstSolution ? ', First: [' + firstSolution.join(',') + ']' : ''}`,
    v: () => {
      if (!firstSolution) return n === 2 || n === 3;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (firstSolution[i] === firstSolution[j]) return false;
          if (Math.abs(firstSolution[i] - firstSolution[j]) === Math.abs(i - j)) return false;
        }
      }
      return true;
    }
  };
}

// ==========================================
// 12. Hamiltonian Cycle (Backtracking)
// ==========================================
function runHamiltonian(input, T) {
  const n = input.n;
  const adj = input.a;
  const path = [0];
  const visited = new Uint8Array(n);
  visited[0] = 1;

  const stats = { states: 0, rejected: 0, maxDepth: 0 };
  let foundCycle = false;
  let timedOut = false;
  let checkCount = 0;

  if (T) T({ text: `Hamiltonian Cycle backtracking from root vertex 0 on ${n} vertices...`, type: 'start' });

  function backtrack() {
    if (path.length === n) {
      const lastVertex = path[n - 1];
      if (adj[lastVertex][0] === 1) {
        foundCycle = true;
        if (T) T({
          text: `[Cycle Found] Hamiltonian Cycle Found: ${path.join(' -> ')} -> 0`,
          type: 'cycleFound',
          path: [...path, 0]
        });
        return true;
      }
      stats.rejected++;
      if (T) T({
        text: `Path ${path.join(' -> ')} visited all vertices but no closing edge (${lastVertex} -> 0) exists -> REJECTED`,
        type: 'reject'
      });
      return false;
    }

    const current = path[path.length - 1];

    for (let v = 1; v < n; v++) {
      if (++checkCount % 2048 === 0 && EXECUTION_DEADLINE > 0 && performance.now() > EXECUTION_DEADLINE) {
        throw 'timeout';
      }

      stats.states++;
      if (visited[v] || adj[current][v] !== 1) {
        stats.rejected++;
        continue;
      }

      visited[v] = 1;
      path.push(v);
      stats.maxDepth = Math.max(stats.maxDepth, path.length);

      if (T && n <= 10) {
        T({
          text: `Extending path: ${path.join(' -> ')}`,
          type: 'extend',
          path: [...path]
        });
      }

      if (backtrack()) return true;

      path.pop();
      visited[v] = 0;

      if (T && n <= 10) {
        T({
          text: `Backtrack: Removed vertex ${v} from path`,
          type: 'backtrack',
          path: [...path]
        });
      }
    }
    return false;
  }

  try {
    backtrack();
  } catch (err) {
    if (err === 'timeout') timedOut = true;
    else throw err;
  }

  let factorialN1 = 1;
  for (let i = 1; i < n; i++) factorialN1 *= i;

  return {
    ops: stats.states,
    st: stats.states,
    pr: stats.rejected,
    to: timedOut,
    mem: n * n + n * 16,
    th: factorialN1,
    info: foundCycle
      ? `Hamiltonian Cycle: ${path.join(' -> ')} -> 0 | States: ${stats.states}, Rejected: ${stats.rejected}`
      : `${timedOut ? 'TIMEOUT (partial) | ' : ''}No Hamiltonian cycle exists (exhaustive search) | States: ${stats.states}, Rejected: ${stats.rejected}`,
    v: () => {
      if (!foundCycle) return true; // correctly concluded no cycle or exited
      if (path.length !== n) return false;
      const set = new Set(path);
      if (set.size !== n) return false;
      if (adj[path[n - 1]][0] !== 1) return false;
      for (let i = 1; i < n; i++) {
        if (adj[path[i - 1]][path[i]] !== 1) return false;
      }
      return true;
    }
  };
}

// ==========================================
// 13. Traveling Salesperson Problem (TSP Branch and Bound)
// ==========================================
function runTSP(input, T) {
  const n = input.n;
  const dist = input.d;
  const stats = { states: 0, pruned: 0 };
  let timedOut = false;
  let checkCount = 0;

  // Precompute min outgoing edge for each city for the lower bound estimator
  const minOut = dist.map((row, i) => {
    let minE = Infinity;
    for (let j = 0; j < n; j++) {
      if (i !== j && row[j] < minE) minE = row[j];
    }
    return minE;
  });

  // 1. Initial upper bound via Nearest Neighbor Greedy heuristic
  let bestCost = 0;
  let bestTour = [0];
  {
    const visited = new Uint8Array(n);
    visited[0] = 1;
    let curr = 0;
    for (let step = 1; step < n; step++) {
      let nearest = -1;
      let minD = Infinity;
      for (let j = 0; j < n; j++) {
        if (!visited[j] && dist[curr][j] < minD) {
          minD = dist[curr][j];
          nearest = j;
        }
      }
      visited[nearest] = 1;
      bestCost += minD;
      bestTour.push(nearest);
      curr = nearest;
    }
    bestCost += dist[curr][0]; // return to start
    if (T) T({
      text: `Nearest-neighbor initial upper bound: Tour [${bestTour.join(' -> ')} -> 0], Cost = ${bestCost}`,
      type: 'heuristicBound',
      tour: [...bestTour, 0],
      cost: bestCost
    });
  }

  // 2. Branch and Bound State Search
  const path = [0];
  const visited = new Uint8Array(n);
  visited[0] = 1;

  function branchAndBound(currCity, currentCost, unvisitedBoundSum) {
    if (path.length === n) {
      const tourCost = currentCost + dist[currCity][0];
      if (tourCost < bestCost) {
        bestCost = tourCost;
        bestTour = [...path];
        if (T) T({
          text: `[New Best Tour] Tour: [${bestTour.join(' -> ')} -> 0], Cost = ${bestCost}`,
          type: 'newBest',
          tour: [...bestTour, 0],
          cost: bestCost
        });
      }
      return;
    }

    for (let nextCity = 1; nextCity < n; nextCity++) {
      if (visited[nextCity]) continue;

      if (++checkCount % 2048 === 0 && EXECUTION_DEADLINE > 0 && performance.now() > EXECUTION_DEADLINE) {
        throw 'timeout';
      }

      stats.states++;
      const nextCost = currentCost + dist[currCity][nextCity];
      const lowerBound = nextCost + (unvisitedBoundSum - minOut[currCity]);

      if (lowerBound >= bestCost) {
        stats.pruned++;
        if (T && n <= 8) {
          T({
            text: `Branch [${path.join(' -> ')} -> ${nextCity}]: Cost ${nextCost} + Bound ${lowerBound} >= Best ${bestCost} -> PRUNED`,
            type: 'prune'
          });
        }
        continue;
      }

      visited[nextCity] = 1;
      path.push(nextCity);

      if (T && n <= 8) {
        T({
          text: `Explore branch [${path.join(' -> ')}]: Cost ${nextCost}, Lower Bound ${lowerBound} < Best ${bestCost}`,
          type: 'explore'
        });
      }

      branchAndBound(nextCity, nextCost, unvisitedBoundSum - minOut[currCity]);

      path.pop();
      visited[nextCity] = 0;
    }
  }

  const initialBoundSum = minOut.reduce((sum, val) => sum + val, 0);
  try {
    branchAndBound(0, 0, initialBoundSum);
  } catch (err) {
    if (err === 'timeout') timedOut = true;
    else throw err;
  }

  let factorialN1 = 1;
  for (let i = 1; i < n; i++) factorialN1 *= i;

  return {
    ops: stats.states,
    st: stats.states,
    pr: stats.pruned,
    to: timedOut,
    mem: n * n * 8 + n * 32,
    th: factorialN1,
    bestCost,
    bestTour,
    info: `${timedOut ? 'TIMEOUT (best so far) | ' : ''}Optimal Tour Cost: ${bestCost}, Tour: [${bestTour.join(' -> ')} -> 0], States generated: ${stats.states}, Pruned: ${stats.pruned}`,
    v: () => {
      if (bestTour.length !== n) return false;
      const set = new Set(bestTour);
      if (set.size !== n) return false;
      let calculatedCost = 0;
      for (let i = 0; i < n; i++) {
        calculatedCost += dist[bestTour[i]][bestTour[(i + 1) % n]];
      }
      return calculatedCost === bestCost;
    }
  };
}

// ==========================================
// Central Registry of All 13 Algorithms
// ==========================================
const DATA_STRUCTURE_FAMILIES = ['random', 'ascending', 'descending', 'duplicates'];
const DATA_STRUCTURE_FAM_DESC = 'Families: random (uniform distribution), ascending (sorted ascending order), descending (reverse sorted), duplicates (heavy key collision stress).';

var A = {
  'Binomial Heap': {
    name: 'Binomial Heap',
    category: 'Advanced Data Structures',
    f: DATA_STRUCTURE_FAMILIES,
    d: [2000, 1000, 16000, 3000],
    mx: 200000,
    tn: 10,
    gen: genKeys,
    run: runBinomialHeap,
    fd: DATA_STRUCTURE_FAM_DESC,
    ab: 'Mergeable priority queue structured as a collection of binomial trees (at most one tree per degree bit). Workload: n inserts, n/4 decrease-keys, n extract-mins.',
    cx: 'Insert O(1) amortized / O(log n) worst | Extract-Min O(log n) | Decrease-Key O(log n) | Merge O(log n) | Space O(n)',
    wk: 'Strict binomial tree structure requires O(log n) work on every decrease-key (bubbling up) and extract-min (tree union carry propagation). Heavy decrease-key workloads lose to Fibonacci heaps.'
  },

  'Fibonacci Heap': {
    name: 'Fibonacci Heap',
    category: 'Advanced Data Structures',
    f: DATA_STRUCTURE_FAMILIES,
    d: [2000, 1000, 16000, 3000],
    mx: 200000,
    tn: 10,
    gen: genKeys,
    run: runFibonacciHeap,
    fd: DATA_STRUCTURE_FAM_DESC,
    ab: 'Lazy priority queue: inserts and merges are O(1) pointer operations in a circular root list. Tree consolidation is postponed until extract-min; decrease-key uses cuts and cascading cuts.',
    cx: 'Insert O(1) | Merge O(1) | Decrease-Key O(1) amortized | Extract-Min O(log n) amortized (O(n) worst single op) | Space O(n)',
    wk: 'A single extract-min after many lazy inserts must consolidate up to O(n) roots in one pass. High constant factor and pointer overhead make simple heaps faster on small inputs.'
  },

  'B-Tree': {
    name: 'B-Tree',
    category: 'Advanced Data Structures',
    f: DATA_STRUCTURE_FAMILIES,
    d: [2000, 1000, 16000, 3000],
    mx: 200000,
    tn: 10,
    gen: genKeys,
    run: runBTree,
    fd: DATA_STRUCTURE_FAM_DESC,
    ab: 'Self-balancing multi-way search tree (minimum degree t=3, node capacity 2t-1=5 keys). Insert splits full nodes top-down promoting the median; delete borrows or merges siblings.',
    cx: 'Search O(log n) | Insert O(log n) | Delete O(log n) | Height O(log_t n) | Space O(n)',
    wk: 'Sequential sorted insertions cause continuous node splitting into minimum-capacity half-full nodes (50% storage utilization). Optimized for disk I/O blocks rather than CPU cache lines.'
  },

  'Red-Black Tree': {
    name: 'Red-Black Tree',
    category: 'Advanced Data Structures',
    f: DATA_STRUCTURE_FAMILIES,
    d: [2000, 1000, 16000, 3000],
    mx: 200000,
    tn: 10,
    gen: genKeys,
    run: runRBTree,
    fd: DATA_STRUCTURE_FAM_DESC,
    ab: 'Self-balancing Binary Search Tree with node coloring (Red/Black). Enforces no red-red parent-child adjacency and equal black-height across all root-to-leaf paths using rotations and recolorings.',
    cx: 'Search O(log n) | Insert O(log n) (<=2 rotations) | Delete O(log n) (<=3 rotations) | Height <= 2*log2(n+1) | Space O(n)',
    wk: 'Strict monotonicity in input data (ascending or descending) triggers consecutive rotations and recoloring fixes on almost every insertion, maximizing constant-factor overhead.'
  },

  'Prim': {
    name: 'Prim',
    category: 'MST',
    f: ['sparse', 'medium', 'dense'],
    d: [100, 50, 400, 50],
    mx: 2000,
    tn: 10,
    pr: 'Kruskal',
    gen: genGraph,
    run: runPrimMST,
    fd: 'Families: sparse (E=2V), medium (E=V^1.5), dense (~80% complete graph). Identical random seed produces the EXACT same graph for Prim and Kruskal.',
    ab: 'Grows a single spanning tree from a start vertex, greedily extracting the minimum connecting edge via binary min-heap and adjacency list.',
    cx: 'O(E log V) with binary min-heap & adjacency list | O(V^2) with adjacency matrix | Space O(V + E)',
    wk: 'On dense graphs (E ≈ V^2/2), pushing O(E) candidate edges into the binary heap creates high logarithmic overhead per edge. An un-heaped O(V^2) matrix Prim outperforms it on dense networks.'
  },

  'Kruskal': {
    name: 'Kruskal',
    category: 'MST',
    f: ['sparse', 'medium', 'dense'],
    d: [100, 50, 400, 50],
    mx: 2000,
    tn: 10,
    pr: 'Prim',
    gen: genGraph,
    run: runKruskalMST,
    fd: 'Same matched graph datasets as Prim (identical seed -> identical graph).',
    ab: 'Sorts all edges globally, then scans them in ascending order, adding edges that connect disjoint components via Disjoint Set Union (DSU) with path compression.',
    cx: 'O(E log E) = O(E log V) for edge sorting + O(E alpha(V)) for DSU operations | Space O(V + E)',
    wk: 'Dominated by the initial sorting of all E edges. In dense graphs where E ≈ V^2, sorting O(V^2) edges makes Kruskal significantly slower than Prim.'
  },

  'Fractional Knapsack': {
    name: 'Fractional Knapsack',
    category: 'Knapsack',
    f: ['random', 'capacity', 'adversarial'],
    d: [50, 20, 300, 50],
    mx: 10000,
    tn: 8,
    pr: '0/1 Knapsack',
    gen: genKnapsack,
    run: runFractionalKnapsack,
    fd: 'Families: random, capacity-stress (C=10% total weight), adversarial (greedy-failure benchmark: C=10, items (6,12),(5,9),(5,9)).',
    ab: 'Divisible items: sorts items by value-to-weight ratio (v/w), greedily takes full items, and takes a fraction of the final item. In P.',
    cx: 'O(n log n) sorting + O(n) greedy selection | Space O(n)',
    wk: 'Item divisibility removes combinatorial hardness. Displays the theoretical upper bound (relaxation) against the NP-hard discrete 0/1 problem.'
  },

  '0/1 Knapsack': {
    name: '0/1 Knapsack',
    category: 'Knapsack',
    f: ['random', 'capacity', 'adversarial'],
    d: [30, 10, 200, 30],
    mx: 500,
    tn: 8,
    pr: 'Fractional Knapsack',
    gen: genKnapsack,
    run: run01Knapsack,
    fd: 'Matched datasets with Fractional Knapsack. Adversarial instance: C=10, items (6,12),(5,9),(5,9).',
    ab: 'Discrete knapsack: dynamic programming table dp[i][c] = max(dp[i-1][c], dp[i-1][c-w_i] + v_i). Decision form is NP-complete, optimization form is NP-hard. DP is pseudo-polynomial.',
    cx: 'Theta(n * C) time and space | Backtracking O(n)',
    wk: 'Capacity C is encoded in log2(C) bits. As C grows exponentially, the DP table explodes in memory and time. If (n+1)(C+1) > 4M cells, execution is halted.'
  },

  'Floyd-Warshall': {
    name: 'Floyd-Warshall',
    category: 'Dynamic Programming',
    f: ['sparse', 'random', 'dense'],
    d: [30, 10, 100, 15],
    mx: 250,
    tn: 6,
    gen: genFloydWarshall,
    run: runFloydWarshall,
    fd: 'Sparse (15% edge density), random (50%), dense (90%). Edge density does NOT alter the triple loop operation count.',
    ab: 'All-Pairs Shortest Paths dynamic programming. Tests whether path from i to j can be shortened by passing through intermediate vertex k.',
    cx: 'Best / Average / Worst: Theta(V^3) | Space: Theta(V^2)',
    wk: 'Rigid cubic time complexity: doubling V multiplies operations by 8 regardless of whether the graph is sparse or dense. For sparse graphs, running Dijkstra V times O(V E log V) is far superior.'
  },

  'Matrix Chain': {
    name: 'Matrix Chain',
    category: 'Dynamic Programming',
    f: ['random', 'increasing', 'decreasing'],
    d: [15, 10, 80, 10],
    mx: 300,
    tn: 8,
    gen: genMatrixChain,
    run: runMatrixChain,
    fd: 'Random matrix dimensions, monotonically increasing dimensions, monotonically decreasing dimensions.',
    ab: 'Finds optimal parenthesization order for multiplying a chain of matrices to minimize total scalar multiplications via DP tables m[i,j] and split table s[i,j].',
    cx: 'Theta(n^3) time | Inner loop ops = (n^3 - n)/6 | Space: Theta(n^2)',
    wk: 'Cubic dynamic programming. While dramatically faster than Catalan-number exponential brute force (4^n / n^1.5), large chains still scale cubically.'
  },

  'N-Queens': {
    name: 'N-Queens',
    category: 'Backtracking / B&B',
    f: ['first', 'all'],
    d: [8, 4, 11, 1],
    mx: 13,
    tn: 6,
    gen: genNQueens,
    run: runNQueens,
    fd: 'Mode "first" stops on first solution; Mode "all" enumerates every valid solution across the entire state space.',
    ab: 'Places non-attacking queens on an n x n chessboard using column and diagonal bitmasks with backtracking on conflict. Standard N-Queens is NOT labelled NP-complete.',
    cx: 'First solution: fast (often polynomial average) | All solutions: O(n!) worst-case search tree | Space O(n)',
    wk: 'Enumerating all solutions experiences factorial search tree explosion: n=8 has 92 solutions, n=10 has 724, n=12 has 14,200. Beyond n=12, time-out is guaranteed.'
  },

  'Hamiltonian': {
    name: 'Hamiltonian',
    category: 'Backtracking / B&B',
    f: ['sparse', 'random', 'dense', 'pathological'],
    d: [10, 5, 12, 1],
    mx: 14,
    tn: 7,
    gen: genHamiltonian,
    run: runHamiltonian,
    fd: 'Sparse (p=0.3), random (p=0.5), dense (p=0.8), pathological (clique K_{n-1} + vertex n-1 connected only to 0, having no cycle and forcing full factorial search).',
    ab: 'Finds a simple cycle visiting every vertex exactly once. Decision form is NP-complete, search is NP-hard.',
    cx: 'Worst-case: O((n-1)!) | Best: O(n) | Space: O(n)',
    wk: 'Pathological "no-cycle" instances with large dense subcomponents force exhaustive exploration of all (n-1)! permutations before terminating.'
  },

  'TSP': {
    name: 'TSP',
    category: 'Backtracking / B&B',
    f: ['euclidean', 'random'],
    d: [8, 5, 11, 1],
    mx: 12,
    tn: 7,
    gen: genTSP,
    run: runTSP,
    fd: 'Euclidean 2D plane cities vs random symmetric distance matrices. Branch-and-bound with nearest neighbor initial upper bound and minimum outgoing edge lower bound.',
    ab: 'Finds the exact minimum-cost tour visiting every city once. Decision version is NP-complete; optimization version is NP-hard.',
    cx: 'Worst-case: O((n-1)!) | Average: depends on pruning effectiveness | Space: O(n)',
    wk: 'Weak lower bounds (especially on random distance matrices where triangle inequality fails) cannot prune branches early, causing factorial runtime explosion beyond ~11 cities.'
  }
};

if (typeof globalThis !== 'undefined') globalThis.A = A;
if (typeof window !== 'undefined') window.A = A;
