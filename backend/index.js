const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity ────────────────────────────────────────────────────────────────
const USER_ID = "bhavna_jayakumar_20042006"; // ← replace with your actual details
const EMAIL_ID = "bj0133@srmist.edu.in";   // ← replace
const ROLL_NUMBER = "RA2311026020099";        // ← replace

// ── Validation ───────────────────────────────────────────────────────────────
function validateEntry(raw) {
  const entry = raw.trim();
  if (!entry) return { valid: false, entry };
  // must match exactly X->Y where X and Y are single uppercase A-Z
  if (!/^[A-Z]->[A-Z]$/.test(entry)) return { valid: false, entry };
  const [parent, child] = entry.split("->");
  if (parent === child) return { valid: false, entry }; // self-loop
  return { valid: true, entry, parent, child };
}

// ── Cycle detection via DFS ───────────────────────────────────────────────────
function hasCycle(root, adjMap) {
  const visited = new Set();
  const stack = new Set();

  function dfs(node) {
    visited.add(node);
    stack.add(node);
    for (const child of (adjMap.get(node) || [])) {
      if (!visited.has(child)) {
        if (dfs(child)) return true;
      } else if (stack.has(child)) {
        return true;
      }
    }
    stack.delete(node);
    return false;
  }

  return dfs(root);
}

// ── Build nested tree object ──────────────────────────────────────────────────
function buildTree(node, adjMap, visited = new Set()) {
  if (visited.has(node)) return {};
  visited.add(node);
  const children = adjMap.get(node) || [];
  const obj = {};
  for (const child of children) {
    obj[child] = buildTree(child, adjMap, visited);
  }
  return obj;
}

// ── Depth = longest root-to-leaf path (node count) ───────────────────────────
function calcDepth(node, adjMap, visited = new Set()) {
  if (visited.has(node)) return 1;
  visited.add(node);
  const children = adjMap.get(node) || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(c => calcDepth(c, adjMap, new Set(visited))));
}

// ── Main processing ───────────────────────────────────────────────────────────
function processData(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const adjMap = new Map();   // parent -> [children]
  const childSet = new Set(); // all nodes that appear as a child
  const allNodes = new Set();

  for (const raw of data) {
    const result = validateEntry(raw);
    if (!result.valid) {
      invalidEntries.push(result.entry);
      continue;
    }

    const { entry, parent, child } = result;
    const key = `${parent}->${child}`;

    if (seenEdges.has(key)) {
      // only push once per duplicate, no matter how many repeats
      if (!duplicateEdges.includes(entry)) {
        duplicateEdges.push(entry);
      }
      continue;
    }

    seenEdges.add(key);

    // Diamond / multi-parent: if child already has a parent, discard
    if (childSet.has(child)) {
      // silently discard — don't add to invalid or duplicate
      continue;
    }

    childSet.add(child);
    allNodes.add(parent);
    allNodes.add(child);

    if (!adjMap.has(parent)) adjMap.set(parent, []);
    adjMap.get(parent).push(child);
    if (!adjMap.has(child)) adjMap.set(child, []);
  }

  // ── Find connected components ─────────────────────────────────────────────
  function getConnectedComponent(startNode) {
    const component = new Set();
    const queue = [startNode];
    while (queue.length) {
      const n = queue.shift();
      if (component.has(n)) continue;
      component.add(n);
      for (const child of (adjMap.get(n) || [])) {
        queue.push(child);
      }
      // also traverse upward via parent lookup
    }
    return component;
  }

  // Build reverse map to find all connected nodes (bidirectional component)
  const reverseMap = new Map();
  for (const [parent, children] of adjMap.entries()) {
    for (const child of children) {
      if (!reverseMap.has(child)) reverseMap.set(child, []);
      reverseMap.get(child).push(parent);
    }
  }

  function getFullComponent(startNode) {
    const component = new Set();
    const queue = [startNode];
    while (queue.length) {
      const n = queue.shift();
      if (component.has(n)) continue;
      component.add(n);
      for (const child of (adjMap.get(n) || [])) queue.push(child);
      for (const parent of (reverseMap.get(n) || [])) queue.push(parent);
    }
    return component;
  }

  // Group all nodes into connected components
  const visited = new Set();
  const components = [];
  const sortedNodes = [...allNodes].sort();

  for (const node of sortedNodes) {
    if (!visited.has(node)) {
      const comp = getFullComponent(node);
      comp.forEach(n => visited.add(n));
      components.push(comp);
    }
  }

  // ── Build hierarchies ─────────────────────────────────────────────────────
  const hierarchies = [];

  for (const comp of components) {
    // Find root(s): nodes not appearing as a child within this component
    const compChildSet = new Set();
    for (const node of comp) {
      for (const child of (adjMap.get(node) || [])) {
        if (comp.has(child)) compChildSet.add(child);
      }
    }
    const roots = [...comp].filter(n => !compChildSet.has(n)).sort();

    // If pure cycle (no roots), use lexicographically smallest node
    const root = roots.length > 0 ? roots[0] : [...comp].sort()[0];

    // Check cycle
    const cycleDetected = hasCycle(root, adjMap);

    if (cycleDetected) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = { [root]: buildTree(root, adjMap) };
      const depth = calcDepth(root, adjMap);
      hierarchies.push({ root, tree, depth });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largestRoot = "";
  let maxDepth = -1;
  for (const h of nonCyclic) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largestRoot)
    ) {
      maxDepth = h.depth;
      largestRoot = h.root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: nonCyclic.length,
      total_cycles: cyclic.length,
      largest_tree_root: largestRoot,
    },
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────
app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Request body must have a 'data' array." });
    }
    const result = processData(data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/", (req, res) => res.json({ status: "BFHL API is live", route: "POST /bfhl" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
