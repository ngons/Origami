/**
 * Rabbit Ear (c) Robby Kraft
 */
import {
  keys,
  non_spec_keys,
  edges_assignment_values,
} from "./keys";
/**
 * this contains two types of methods.
 * 1. methods that are mostly references, including lists of keys
 *    that match the FOLD 1.1 specification (anytime FOLD is updated
 *    we need to update here too.)
 * 2. methods that operate on a FOLD object, searching and gathering
 *    and re-arranging keys or values based on key queries.
 */
/**
 * English conversion from the plural form of words to the singular
 */
export const singularize = {
  vertices: "vertex",
  edges: "edge",
  faces: "face",
};
/**
 * English word for what each edge assignment stands for.
 * both upper and lowercase letter keys reference the word.
 */
export const edges_assignment_names = {
  b: "boundary",
  m: "mountain",
  v: "valley",
  f: "flat",
  u: "unassigned"
};
edges_assignment_values.forEach(key => {
  edges_assignment_names[key.toUpperCase()] = edges_assignment_names[key];
});
/**
 * @description convert upper or lowercase edge assignments to lowercase.
 * because edge assignments can be lower or uppercase, this object
 * contains both cases as keys, where the values are only lowercase
 */
export const edges_assignment_to_lowercase = {};
edges_assignment_values.forEach(key => {
  edges_assignment_to_lowercase[key] = key.toLowerCase();
});
export const edges_assignment_degrees = {
  M: -180,
  m: -180,
  V: 180,
  v: 180,
  B: 0,
  b: 0,
  F: 0,
  f: 0,
  U: 0,
  u: 0
};
/**
 * @param {string} one edge assignment letter, any case: M V B F U
 * @returns {number} fold angle in degrees. M/V are assumed to be flat-folded.
 */
export const edge_assignment_to_foldAngle = assignment =>
  edges_assignment_degrees[assignment] || 0;
/**
 * @param {number} fold angle in degrees.
 * @returns {string} one edge assignment letter: M V or U, no boundary detection.
 *
 * todo: what should be the behavior for 0, undefined, null?
 */
export const edge_foldAngle_to_assignment = (a) => {
  if (a > 0) { return "V"; }
  if (a < 0) { return "M"; }
  // if (a === 0) { return "F"; }
  return "U";
};
const flat_angles = { 0: true, "-0": true, 180: true, "-180": true };
export const edge_foldAngle_is_flat = angle => flat_angles[angle] === true;
/**
 * @description determine if an edges_foldAngle array contains only
 * flat-folded angles, strictly the set: 0, -180, or +180.
 * If a graph contains no "edges_foldAngle", implicitly the angles
 * are flat, and the method returns "true".
 * @returns {boolean} is the graph flat-foldable according to foldAngles.
 */
export const edges_foldAngle_all_flat = ({ edges_foldAngle }) => {
  if (!edges_foldAngle) { return true; }
  for (let i = 0; i < edges_foldAngle.length; i++) {
    if (!flat_angles[edges_foldAngle[i]]) { return false; }
  }
  return true;
};
/**
 * @param {object} any object
 * @param {string} a suffix to match against the keys
 * @returns {string[]} array of keys that end with the string param
 */
export const filter_keys_with_suffix = (graph, suffix) => Object
  .keys(graph)
  .map(s => (s.substring(s.length - suffix.length, s.length) === suffix
    ? s : undefined))
  .filter(str => str !== undefined);
/**
 * @param {object} any object
 * @param {string} a prefix to match against the keys
 * @returns {string[]} array of keys that start with the string param
 */
export const filter_keys_with_prefix = (graph, prefix) => Object
  .keys(graph)
  .map(str => (str.substring(0, prefix.length) === prefix
    ? str : undefined))
  .filter(str => str !== undefined);
/**
 * return a list of keys from a FOLD object that match a provided
 * string such that the key STARTS WITH this string followed by a _.
 *
 * for example: "vertices" will return:
 * vertices_coords, vertices_faces,
 * but not edges_vertices, or verticesCoords (must end with _)
 */
export const get_graph_keys_with_prefix = (graph, key) =>
  filter_keys_with_prefix(graph, `${key}_`);
/**
 * return a list of keys from a FOLD object that match a provided
 * string such that the key ENDS WITH this string, preceded by _.
 *
 * for example: "vertices" will return:
 * edges_vertices, faces_vertices,
 * but not vertices_coords, or edgesvertices (must prefix with _)
 */
export const get_graph_keys_with_suffix = (graph, key) =>
  filter_keys_with_suffix(graph, `_${key}`);

/**
 * this takes in a geometry_key (vectors, edges, faces), and flattens
 * across all related arrays, creating 1 array of objects with the keys
 */
export const transpose_graph_arrays = (graph, geometry_key) => {
  const matching_keys = get_graph_keys_with_prefix(graph, geometry_key);
  if (matching_keys.length === 0) { return []; }
  const len = Math.max(...matching_keys.map(arr => graph[arr].length));
  const geometry = Array.from(Array(len))
    .map(() => ({}));
  // approach 1: this removes the geometry name from the geometry key
  // since it should be implied
  // matching_keys
  //   .map(k => ({ long: k, short: k.substring(geometry_key.length + 1) }))
  //   .forEach(key => geometry
  //     .forEach((o, i) => { geometry[i][key.short] = graph[key.long][i]; }));
  // approach 2: preserve geometry key
  matching_keys
    .forEach(key => geometry
      .forEach((o, i) => { geometry[i][key] = graph[key][i]; }));
  return geometry;
};

/**
 * this takes in a geometry_key (vectors, edges, faces), and flattens
 * across all related arrays, creating 1 array of objects with the keys
 */
export const transpose_graph_array_at_index = function (
  graph,
  geometry_key,
  index
) {
  const matching_keys = get_graph_keys_with_prefix(graph, geometry_key);
  if (matching_keys.length === 0) { return undefined; }
  const geometry = {};
  // matching_keys
  //   .map(k => ({ long: k, short: k.substring(geometry_key.length + 1) }))
  //   .forEach((key) => { geometry[key.short] = graph[key.long][index]; });
  matching_keys.forEach((key) => { geometry[key] = graph[key][index]; });
  return geometry;
};

export const fold_object_certainty = (object = {}) => (
  Object.keys(object).length === 0
    ? 0
    : [].concat(keys, non_spec_keys)
      .filter(key => object[key]).length / Object.keys(object).length);
