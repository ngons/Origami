/**
 * Rabbit Ear (c) Robby Kraft
 */
import math from "../math";
import { filter_keys_with_suffix } from "../fold/spec";
/**
 * @description apply an affine transform to a graph; this includes
 * modifying the position of any key ending with "_coords" and multiplying
 * any matrix in keys that end with "_matrix".
 * @param {object} a FOLD graph
 * @param {number[]} 3x4 matrix as a 12 number array
 * @returns {object} the same input graph, modified
 */
const apply_matrix_to_graph = function (graph, matrix) {
  // apply to anything with a coordinate value
  filter_keys_with_suffix(graph, "coords").forEach((key) => {
    graph[key] = graph[key]
      .map(v => math.core.resize(3, v))
      .map(v => math.core.multiply_matrix3_vector3(matrix, v));
  });
  // update all matrix types
  // todo, are these being multiplied in the right order?
  filter_keys_with_suffix(graph, "matrix").forEach((key) => {
    graph[key] = graph[key]
      .map(m => math.core.multiply_matrices3(m, matrix));
  });
  return graph;
};
/**
 * @description apply a uniform affine scale to a graph.
 * @param {object} a FOLD graph
 * @param {number} the scale amount
 * @param {number[]} optional. an array or series of numbers, the center of scale.
 * @returns {object} the same input graph, modified.
 */
const transform_scale = (graph, scale, ...args) => {
  const vector = math.core.get_vector(...args);
  const vector3 = math.core.resize(3, vector);
  const matrix = math.core.make_matrix3_scale(scale, vector3);
  return apply_matrix_to_graph(graph, matrix);
};
/**
 * @description apply a translation to a graph.
 * @param {object} a FOLD graph
 * @param {number[]} optional. an array or series of numbers, the translation vector
 * @returns {object} the same input graph, modified
 */
const transform_translate = (graph, ...args) => {
  const vector = math.core.get_vector(...args);
  const vector3 = math.core.resize(3, vector);
  const matrix = math.core.make_matrix3_translate(...vector3);
  return apply_matrix_to_graph(graph, matrix);
};
/**
 * @description apply a rotation to a graph around the +Z axis.
 * @param {object} a FOLD graph
 * @param {number} the rotation amount in radians
 * @param {number[]} optional. an array or series of numbers, the center of rotation
 * @returns {object} the same input graph, modified
 */
const transform_rotateZ = (graph, angle, ...args) => {
  const vector = math.core.get_vector(...args);
  const vector3 = math.core.resize(3, vector);
  const matrix = math.core.make_matrix3_rotateZ(angle, ...vector3);
  return apply_matrix_to_graph(graph, matrix);
};

// make_matrix3_rotate
// make_matrix3_rotateX
// make_matrix3_rotateY
// make_matrix3_reflectZ

export default {
  scale: transform_scale,
  translate: transform_translate,
  rotateZ: transform_rotateZ,
  transform: apply_matrix_to_graph,
};
