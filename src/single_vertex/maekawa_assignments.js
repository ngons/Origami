/**
 * Rabbit Ear (c) Robby Kraft
 */
const get_unassigned_indices = (edges_assignment) => edges_assignment
  .map((_, i) => i)
  .filter(i => edges_assignment[i] === "U" || edges_assignment[i] === "u");

// sectors and assignments are fenceposted.
// sectors[i] is bounded by assignment[i] assignment[i + 1]
const maekawa_assignments = (vertices_edges_assignments) => {
  const unassigneds = get_unassigned_indices(vertices_edges_assignments);
  const permuts = Array.from(Array(2 ** unassigneds.length))
    .map((_, i) => i.toString(2))
    .map(l => Array(unassigneds.length - l.length + 1).join("0") + l)
    .map(str => Array.from(str).map(l => l === "0" ? "V" : "M"));
  const all = permuts.map(perm => {
    const array = vertices_edges_assignments.slice();
    unassigneds.forEach((index, i) => { array[index] = perm[i]; })
    return array;
  });
  if (vertices_edges_assignments.includes("B") ||
    vertices_edges_assignments.includes("b")) {
    return all;
  }
  const count_m = all.map(a => a.filter(l => l === "M" || l === "m").length);
  const count_v = all.map(a => a.filter(l => l === "V" || l === "v").length);
  return all.filter((_, i) => Math.abs(count_m[i] - count_v[i]) === 2);
};

export default maekawa_assignments;
