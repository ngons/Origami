import math from "../../math";
/**
 * @param {object} destination FOLD graph, new vertices will be added to this graph
 * @param {object} source FOLD graph, vertices from here will be added to the other graph
 * @returns {array} index of vertex in new vertices_coords array. matches array size of source vertices.
 */
const add_vertices_unique = (graph, { vertices_coords }) => {
  if (!graph.vertices_coords) { graph.vertices_coords = []; }
  // make an array that matches the new vertices_coords where each entry is either
  // - undefined, if the vertex is unique
  // - number, index of duplicate vertex in source graph, if duplicate exists
  const endpoints_vertex_equivalent = vertices_coords
    .map(vertex => graph.vertices_coords
      .map(v => math.core.distance(v, vertex) < math.core.EPSILON)
      .map((on_vertex, i) => on_vertex ? i : undefined)
      .filter(a => a !== undefined)
      .shift());
  // to be used in the return data array
  let index = graph.vertices_coords.length;
  // add the unique vertices to the destination graph
  const unique_vertices = vertices_coords
    .filter((vert, i) => endpoints_vertex_equivalent[i] === undefined);
  graph.vertices_coords.push(...unique_vertices);
  // return the indices of the added vertices in the destination graph
  return endpoints_vertex_equivalent
    .map(el => el === undefined ? index++ : el);
};

export default add_vertices_unique;
