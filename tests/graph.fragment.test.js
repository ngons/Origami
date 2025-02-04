const ear = require("../rabbit-ear.js");

test("fragment 2 lines, x formation", () => {
	const graph = {
		vertices_coords: [[1, 1], [9, 2], [2, 9], [11, 10]],
		edges_vertices: [[0, 3], [1, 2]],
		edges_assignment: ["M", "V"]
	};
	const res = ear.graph.fragment(graph);
	expect(graph.vertices_coords.length).toBe(5);
});

test("fragment two loops 'x-' x with a horizontal dash from its center", () => {
	const graph = {
		vertices_coords: [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5], [2, 0.5]],
		edges_vertices: [[0, 3], [1, 2], [4, 5]],
		edges_assignment: ["M", "V", "F"]
	};
	const res = ear.graph.fragment(graph);
	expect(JSON.stringify(res.edges.map)).toBe(JSON.stringify([[0,1], [2,3], [4]]));
	expect(JSON.stringify(graph.edges_assignment)).toBe(JSON.stringify(["M", "M", "V", "V", "F"]));
	expect(graph.vertices_coords.length).toBe(6);
});

test("fragment dup verts", () => {
	const graph = {
		vertices_coords: [[0, 0], [1, 0], [0, 0], [0, 1], [0, 0], [-1, 0], [0, 0], [0, -1]],
		edges_vertices: [[0, 1], [2, 3], [4, 5], [6, 7]],
		edges_assignment: ["M", "V", "F", "B"]
	};
	const res = ear.graph.fragment(graph);
	expect(JSON.stringify(res.vertices.map)).toBe(JSON.stringify([0, 1, 0, 2, 0, 3, 0, 4]));
	expect(JSON.stringify(res.edges.map)).toBe(JSON.stringify([[0], [1], [2], [3]]));
	expect(graph.vertices_coords.length).toBe(5);
});

test("fragment, one edges crossing boundary, more assignments than fold angles", () => {
  const graph = ear.graph.square();
  graph.vertices_coords.push([-0.1, 0.3], [1.1, 0.9]);
  graph.edges_vertices.push([4, 5]);
  graph.edges_assignment.push("V");

  const res = ear.graph.fragment(graph);

  expect(graph.vertices_coords.length).toBe(8);
  expect(graph.edges_vertices.length).toBe(9);
  expect(graph.edges_assignment.filter(a => a === "B" || a === "b").length).toBe(6);
  expect(graph.edges_assignment.filter(a => a === "V" || a === "v").length).toBe(3);
  expect(graph.edges_foldAngle.filter(a => a === 0).length).toBe(6);
  expect(graph.edges_foldAngle.filter(a => a === 180).length).toBe(3);
});

test("fragment, two crossing edges, more assignments than fold angles", () => {
  const graph = ear.graph.square();
  graph.vertices_coords.push([-0.1, 0.3], [1.1, 0.9]);
  graph.vertices_coords.push([0.2, -0.1], [0.8, 1.1]);
  graph.edges_vertices.push([4, 5]);
  graph.edges_vertices.push([6, 7]);
  graph.edges_assignment.push("V");
  graph.edges_assignment.push("M");

  const res = ear.graph.fragment(graph);

  expect(graph.vertices_coords.length).toBe(13);
  expect(graph.edges_vertices.length).toBe(16);
  expect(graph.edges_assignment.filter(a => a === "B" || a === "b").length).toBe(8);
  expect(graph.edges_assignment.filter(a => a === "V" || a === "v").length).toBe(4);
  expect(graph.edges_assignment.filter(a => a === "M" || a === "m").length).toBe(4);
  expect(graph.edges_foldAngle.filter(a => a === 0).length).toBe(8);
  expect(graph.edges_foldAngle.filter(a => a === 180).length).toBe(4);
  expect(graph.edges_foldAngle.filter(a => a === -180).length).toBe(4);
});

test("fragment 2 lines, collinear", () => {
	const graph = {
		vertices_coords: [[1, 1], [3, 3], [5, 5], [7, 7]],
		edges_vertices: [[0, 3], [1, 2]],
		edges_assignment: ["M", "V"]
	};
	const res = ear.graph.fragment(graph);
	expect(graph.vertices_coords.length).toBe(4);
	expect(graph.edges_vertices.length).toBe(3);
});
