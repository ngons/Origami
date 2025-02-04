import math from "../math";
import {
  make_vertices_faces,
  make_vertices_to_edge_bidirectional,
  make_edges_foldAngle,
  make_edges_assignment,
} from "./make";
import {
  make_face_spanning_tree,
} from "./face_spanning_tree";
/**
 * @description given a FOLD object and a set of 2x3 matrices, one per face,
 * "fold" the vertices by finding one matrix per vertex and multiplying them.
 * @param {object} FOLD graph with vertices_coords, faces_vertices, and
 * if vertices_faces does not exist it will be built.
 * @param {number[][]} an array of 2x3 matrices. one per face.
 * @returns {number[][]} a new set of vertices_coords, transformed.
 */
export const multiply_vertices_faces_matrix2 = ({ vertices_coords, vertices_faces, faces_vertices }, faces_matrix) => {
  if (!vertices_faces) {
    vertices_faces = make_vertices_faces({ faces_vertices });
  }
  const vertices_matrix = vertices_faces
    .map(faces => faces
      .filter(a => a != null)
      .shift())
    .map(face => face === undefined
      ? math.core.identity2x3
      : faces_matrix[face]);
  return vertices_coords
    .map((coord, i) => math.core.multiply_matrix2_vector2(vertices_matrix[i], coord));
};
const unassigned_angle = { U: true, u: true };
/**
 * This traverses an face-adjacency tree (edge-adjacent faces),
 * and recursively applies the affine transform that represents a fold
 * across the edge between the faces
 *
 * Flat/Mark creases are ignored!
 * the difference between the matrices of two faces separated by
 * a mark crease is the identity matrix.
 */
// { vertices_coords, edges_vertices, edges_foldAngle, faces_vertices, faces_faces}
export const make_faces_matrix = ({ vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces }, root_face = 0) => {
  if (!edges_assignment && edges_foldAngle) {
    edges_assignment = make_edges_assignment({ edges_foldAngle });
  }
  if (!edges_foldAngle) {
    if (edges_assignment) {
      edges_foldAngle = make_edges_foldAngle({ edges_assignment });
    } else {
      // if no edges_foldAngle data exists, everyone gets identity matrix
      edges_foldAngle = Array(edges_vertices.length).fill(0);
    }
  }
  const edge_map = make_vertices_to_edge_bidirectional({ edges_vertices });
  const faces_matrix = faces_vertices.map(() => math.core.identity3x4);
  make_face_spanning_tree({ faces_vertices, faces_faces }, root_face)
    .slice(1) // remove the first level, it has no parent face
    .forEach(level => level
      .forEach((entry) => {
        const coords = entry.edge_vertices.map(v => vertices_coords[v]);
        const edgeKey = entry.edge_vertices.join(" ");
        const edge = edge_map[edgeKey];
        // if the assignment is unassigned, assume it is a flat fold.
        const foldAngle = unassigned_angle[edges_assignment[edge]]
          ? Math.PI
          : edges_foldAngle[edge] * Math.PI / 180;
        const local_matrix = math.core.make_matrix3_rotate(
          foldAngle, // rotation angle
          math.core.subtract(...math.core.resize_up(coords[1], coords[0])), // line-vector
          coords[0], // line-origin
        );
        faces_matrix[entry.face] = math.core
          .multiply_matrices3(faces_matrix[entry.parent], local_matrix);
          // to build the inverse matrix, switch these two parameters
          // .multiply_matrices3(local_matrix, faces_matrix[entry.parent]);
      }));
  return faces_matrix;
};
/**
 * @description this is assuming the crease pattern contains flat folds only.
 * for every edge, give us a boolean:
 * - "true" if the edge is folded, valley or mountain, or unassigned
 * - "false" if the edge is not folded, flat or boundary.
 * 
 * "unassigned" is considered folded so that an unsolved crease pattern
 * can be fed into here and we still compute the folded state.
 * However, if there is no edges_assignments, and we have to use edges_foldAngle,
 * the "unassigned" trick will no longer work, only +/- non zero numbers get
 * counted as folded edges (true).
 * 
 * For this reason, treating "unassigned" as a folded edge, this method's
 * functionality is better considered to be specific to make_faces_matrix2,
 * instead of a generalized method. 
 */
const assignment_is_folded = {
  M: true, m: true, V: true, v: true, U: true, u: true,
  F: false, f: false, B: false, b: false,
};
export const make_edges_is_flat_folded = ({ edges_vertices, edges_foldAngle, edges_assignment}) => {
  if (edges_assignment === undefined) {
    return edges_foldAngle === undefined
      ? edges_vertices.map(_ => true)
      : edges_foldAngle.map(angle => angle < 0 || angle > 0);
  }
  return edges_assignment.map(a => assignment_is_folded[a]);  
};
/**
 * @description 2D matrices, for flat-folded origami
 */
export const make_faces_matrix2 = ({ vertices_coords, edges_vertices, edges_foldAngle, edges_assignment, faces_vertices, faces_faces }, root_face = 0) => {
  if (!edges_foldAngle) {
    if (edges_assignment) {
      edges_foldAngle = make_edges_foldAngle({ edges_assignment });
    } else {
      // if no edges_foldAngle data exists, everyone gets identity matrix
      edges_foldAngle = Array(edges_vertices.length).fill(0);
    }
  }
  const edges_is_folded = make_edges_is_flat_folded({ edges_vertices, edges_foldAngle, edges_assignment });
  const edge_map = make_vertices_to_edge_bidirectional({ edges_vertices });
  const faces_matrix = faces_vertices.map(() => math.core.identity2x3);
  make_face_spanning_tree({ faces_vertices, faces_faces }, root_face)
    .slice(1) // remove the first level, it has no parent face
    .forEach(level => level
      .forEach((entry) => {
        const coords = entry.edge_vertices.map(v => vertices_coords[v]);
        const edgeKey = entry.edge_vertices.join(" ");
        const edge = edge_map[edgeKey];
        const reflect_vector = math.core.subtract2(coords[1], coords[0]);
        const reflect_origin = coords[0];
        const local_matrix = edges_is_folded[edge]
          ? math.core.make_matrix2_reflect(reflect_vector, reflect_origin)
          : math.core.identity2x3;
        faces_matrix[entry.face] = math.core
          .multiply_matrices2(faces_matrix[entry.parent], local_matrix);
          // to build the inverse matrix, switch these two parameters
          // .multiply_matrices2(local_matrix, faces_matrix[entry.parent]);
      }));
  return faces_matrix;
};
