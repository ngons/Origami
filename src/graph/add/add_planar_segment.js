/**
 * Rabbit Ear (c) Robby Kraft
 */
import math from "../../math";
import {
  make_edges_segment_intersection,
} from "../intersect";
import split_edge from "../split_edge/index";
import remove from "../remove";
import { merge_nextmaps } from "../maps";
import {
  sort_vertices_along_vector,
  sort_vertices_counter_clockwise,
} from "../sort";
import {
  make_vertices_to_edge_bidirectional,
  make_vertices_faces,
  make_vertices_sectors,
  make_edges_faces_unsorted,
  make_faces_faces,
} from "../make";
import add_vertices from "../add/add_vertices";
import {
  counter_clockwise_walk,
  filter_walked_boundary_face,
} from "../walk";
/**
 * @description given a list of vertices in a graph which:
 * - these vertices have alreaddy been added to the graph
 * - this list of vertices has already been sorted along the vector
 * create a set of edges in the graph that connect these vertices, with
 * one important detail: don't add edges which already exist in the graph.
 *
 * appending: edges_vertices, edges_assignment ("U"), edges_foldAngle (0).
 * rebuilding: vertices_vertices, vertices_edges.
 * ignoring face data. faces will be walked and rebuilt later.
 */
const add_segment_edges = (graph, segment_vertices, pre_edge_map) => {
  // without looking at the graph, connect all the segment vertices
  // fenceposted to create a list of N-1 edges.
  const unfiltered_segment_edges_vertices = Array
    .from(Array(segment_vertices.length - 1))
    .map((_, i) => [segment_vertices[i], segment_vertices[i + 1]]);
  // check the list of segments against the edge_map and mark
  // each segment which already exists as "false".
  const seg_not_exist_yet = unfiltered_segment_edges_vertices
    .map(verts => verts.join(" "))
    .map((str, i) => pre_edge_map[str] === undefined);
  // now, build the actual edges which will be added to the graph
  // by filtering out the edges which already exist
  const segment_edges_vertices = unfiltered_segment_edges_vertices
    .filter((_, i) => seg_not_exist_yet[i]);
  // these are the indices of the new segments.
  const segment_edges = Array
    .from(Array(segment_edges_vertices.length))
    .map((_, i) => graph.edges_vertices.length + i)
  // add new edges to the graph, these edges compose the new segment.
  // add edges_vertices.
  segment_edges.forEach((e, i) => {
    graph.edges_vertices[e] = segment_edges_vertices[i];
  });
  // only update these arrays if they exist.
  if (graph.edges_assignment) {
    segment_edges.forEach(e => { graph.edges_assignment[e] = "U"; });
  }
  if (graph.edges_foldAngle) {
    segment_edges.forEach(e => { graph.edges_foldAngle[e] = 0; });
  }
  // build vertices_vertices
  // for each vertex (n), get the previous (n-1) and the next (n+1)
  // by default, the endpoints will not have neighbor vertices on either side,
  // and most importantly, use the "seg_not_exist_yet" from earlier to
  // check if an edge already existed, and prevent joining vertices across
  // these already existing edges.
  for (let i = 0; i < segment_vertices.length; i++) {
    const vertex = segment_vertices[i];
    const prev = seg_not_exist_yet[i - 1] ? segment_vertices[i - 1] : undefined;
    const next = seg_not_exist_yet[i] ? segment_vertices[i + 1] : undefined;
    const new_adjacent_vertices = [prev, next].filter(a => a !== undefined);
    // for the two vertices that are the segment's endpoints, if they are
    // not collinear vertices, they will not yet have a vertices_vertices.
    const previous_vertices_vertices = graph.vertices_vertices[vertex]
      ? graph.vertices_vertices[vertex] : [];
    const unsorted_vertices_vertices = previous_vertices_vertices
      .concat(new_adjacent_vertices);
    graph.vertices_vertices[vertex] = sort_vertices_counter_clockwise(
      graph, unsorted_vertices_vertices, segment_vertices[i]);
  }
  // build vertices_edges from vertices_vertices
  const edge_map = make_vertices_to_edge_bidirectional(graph);
  for (let i = 0; i < segment_vertices.length; i++) {
    const vertex = segment_vertices[i];
    graph.vertices_edges[vertex] = graph.vertices_vertices[vertex]
      .map(v => edge_map[`${vertex} ${v}`]);
  }
  // build vertices_sectors from vertices_vertices
  segment_vertices
    .map(center => graph.vertices_vertices[center].length === 1
    ? [math.core.TWO_PI]
    : math.core.counter_clockwise_sectors2(graph.vertices_vertices[center]
      .map(v => math.core
        .subtract2(graph.vertices_coords[v], graph.vertices_coords[center]))))
    .forEach((sectors, i) => {
      graph.vertices_sectors[segment_vertices[i]] = sectors;
    });
  return segment_edges;
};
/**
 * fragment_edges is the fragment operation but will only operate on a
 * subset of edges.
 */
const add_planar_segment = (graph, point1, point2, epsilon = math.core.EPSILON) => {
  // vertices_sectors not a part of the spec, might not be included.
  // this is needed for when we walk faces. we need to be able to
  // identify the one face that winds around the outside enclosing Infinity.
  if (!graph.vertices_sectors) {
    graph.vertices_sectors = make_vertices_sectors(graph);
  }
  // flatten input points to the Z=0 plane
  const segment = [point1, point2].map(p => [p[0], p[1]]);
  const segment_vector = math.core.subtract2(segment[1], segment[0]);
  // not sure this is wanted. project all vertices onto the XY plane.
  // graph.vertices_coords = graph.vertices_coords
  //   .map(coord => coord.slice(0, 2));
  // get all edges which intersect the segment.
  const intersections = make_edges_segment_intersection(
    graph, segment[0], segment[1], epsilon);
  // get the indices of the edges, sorted.
  const intersected_edges = intersections
    .map((pt, e) => pt === undefined ? undefined : e)
    .filter(a => a !== undefined)
    .sort((a, b) => a - b);
  // using edges_faces, get all faces which have an edge intersected.
  const faces_map = {};
  intersected_edges
    .forEach(e => graph.edges_faces[e]
      .forEach(f => { faces_map[f] = true; }));
  const intersected_faces = Object.keys(faces_map)
    .map(s => parseInt(s))
    .sort((a, b) => a - b);
  // split all intersected edges into two edges, in reverse order
  // so that the "remove()" call only ever removes the last from the
  // set of edges. each split_edge call also rebuilds all graph data,
  // vertices, faces, adjacent of each, etc..
  const split_edge_results = intersected_edges
    .reverse()
    .map(edge => split_edge(graph, edge, intersections[edge], epsilon))
  const split_edge_vertices = split_edge_results.map(el => el.vertex);
  // do we need this? changelog for edges? maybe it will be useful someday.
  // todo, should this list be reversed?
  // if the segment crosses at the intersection of some edges,
  // this algorithm produces maps with a bunch of undefineds.
  // const split_edge_maps = split_edge_results.map(el => el.edges.map);
  // console.log("split_edge_maps", split_edge_maps);
  // const split_edge_map = split_edge_maps
  //   .splice(1)
  //   .reduce((a, b) => merge_nextmaps(a, b), split_edge_maps[0]);
  // now that all edges have been split their new vertices have been
  // added to the graph, add the original segment's two endpoints.
  // we waited until here because this method will search all existing
  // vertices, and avoid adding a duplicate, which will happen in the
  // case of an endpoint lies collinear along a split edge.
  const endpoint_vertices = add_vertices(graph, segment, epsilon);
  // use a hash as an intermediary, make sure new vertices are unique.
  // duplicate vertices will occur in the case of a collinear endpoint.
  const new_vertex_hash = {};
  split_edge_vertices.forEach(v => { new_vertex_hash[v] = true; });
  endpoint_vertices.forEach(v => { new_vertex_hash[v] = true; });
  const new_vertices = Object.keys(new_vertex_hash).map(n => parseInt(n));
  // these vertices are sorted in the direction of the segment
  const segment_vertices = sort_vertices_along_vector(graph, new_vertices, segment_vector);

  const edge_map = make_vertices_to_edge_bidirectional(graph);
  // this method returns the indices of the edges that compose the segment.
  // this array is this method's return value.
  const segment_edges = add_segment_edges(graph, segment_vertices, edge_map);
  // update the edge_map with the new segment edges. this is needed for
  // after we walk faces, the faces_edges data comes in the form of
  // vertex pairs, and we need to be able to look up these new edges.
  segment_edges.forEach(e => {
    const v = graph.edges_vertices[e];
    edge_map[`${v[0]} ${v[1]}`] = e;
    edge_map[`${v[1]} ${v[0]}`] = e;
  });
  // in preparation to rebuild faces, we need a set of edges (as a
  // pair of vertices) to begin a counter-clockwise walk. it's
  // insufficient to simply start the walks from all of the new segment's
  // edges, as it would fail this case: the segment splits a face and
  // ends collinear, so that no part of the segment exists INSIDE the face
  // and the face will never be walked.
  // __________
  // [        ]   segment
  // [  face  O-------------
  // [        ]
  // ----------
  // therefore, we will use all of the vertices_vertices from the
  // segment's vertices. this seems to cover all cases.
  // additionally, we don't have to worry about repeating faces, the
  // method has a protection against that ("walked_edges").
  const face_walk_start_pairs = segment_vertices
    .map((v, i) => graph.vertices_vertices[v]
      .map(adj_v => [[adj_v, v], [v, adj_v]]))
    .reduce((a, b) => a.concat(b), [])
    .reduce((a, b) => a.concat(b), []);
  // graph.vertices_sectors = make_vertices_sectors(graph);
  // memo to prevent duplicate faces. this one object should be
  // applied globally to all calls to the method.
  const walked_edges = {};
  // build faces by begin walking from the set of vertex pairs.
  // this includes the one boundary face in the wrong winding direction
  const all_walked_faces = face_walk_start_pairs
    .map(pair => counter_clockwise_walk(graph, pair[0], pair[1], walked_edges))
    .filter(a => a !== undefined);
  // filter out the one boundary face with wrong winding (if it exists)
  const walked_faces = filter_walked_boundary_face(all_walked_faces);
  // const walked_faces = all_walked_faces;
  // this method could be called before or after the walk. but
  // for simplicity we're calling it before adding the new faces.
  remove(graph, "faces", intersected_faces);
  // todo: this assumes faces_vertices exists.
  const new_faces = walked_faces
    .map((_, i) => graph.faces_vertices.length + i);
  // add each array, only if they exist.
  if (graph.faces_vertices) {
    new_faces.forEach((f, i) => {
      graph.faces_vertices[f] = walked_faces[i].vertices;
    });
  }
  // edges are in vertex pairs. these need to be converted to edges
  if (graph.faces_edges) {
    new_faces.forEach((f, i) => {
      graph.faces_edges[f] = walked_faces[i].edges
        .map(pair => edge_map[pair]);
    });
  }
  // tbh, this array is not typically used.
  if (graph.faces_angles) {
    new_faces.forEach((f, i) => {
      graph.faces_angles[f] = walked_faces[i].faces_angles;
    });
  }
  // update all the arrays which reference face arrays, this includes
  // vertices_faces, edges_faces, faces_faces (all that end with _faces)
  if (graph.vertices_faces) {
    graph.vertices_faces = make_vertices_faces(graph);
  }
  if (graph.edges_faces) {
    graph.edges_faces = make_edges_faces_unsorted(graph);
  }
  if (graph.faces_faces) {
    graph.faces_faces = make_faces_faces(graph);
  }
  // todo, get rid of this after testing.
  if (graph.vertices_coords.length !== graph.vertices_vertices.length
    || graph.vertices_coords.length !== graph.vertices_edges.length
    || graph.vertices_coords.length !== graph.vertices_faces.length) {
    console.warn("vertices mismatch", JSON.parse(JSON.stringify(graph)));
  }
  if (graph.edges_vertices.length !== graph.edges_faces.length
    || graph.edges_vertices.length !== graph.edges_assignment.length) {
    console.warn("edges mismatch", JSON.parse(JSON.stringify(graph)));
  }
  if (graph.faces_vertices.length !== graph.faces_edges.length
    || graph.faces_vertices.length !== graph.faces_faces.length) {
    console.warn("faces mismatch", JSON.parse(JSON.stringify(graph)));
  }
  // console.log("intersected_edges", intersected_edges);
  // console.log("intersected_faces", intersected_faces);
  // console.log("split_edge_results", split_edge_results);
  // console.log("split_edge_map", split_edge_map);
  // console.log("split_edge_vertices", split_edge_vertices);
  // console.log("vertices_vertices", split_edge_vertices
  //   .map(v => graph.vertices_vertices[v]));
  // console.log("endpoint_vertices", endpoint_vertices);
  // console.log("new_vertices", new_vertices);
  // console.log("segment_vertices", segment_vertices);
  // console.log("segment_vertex_pairs", segment_vertex_pairs);
  // console.log("walked_faces", walked_faces);
  // console.log("new_check", new_check);
  return segment_edges;
};

export default add_planar_segment;
