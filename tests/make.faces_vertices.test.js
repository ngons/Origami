const ear = require("../rabbit-ear");
const fs = require("fs");

// we do want this method. bring this back (idk when it was even here)
test("faces_vertices", () => {
  expect(true).toBe(true);
  // const craneJSON = fs.readFileSync("./tests/files/crane.fold");
  // const crane = JSON.parse(craneJSON);
  // delete crane.faces_vertices;
  // // crane.vertices_vertices = ear.graph.make_vertices_vertices(crane);
  // crane.faces_vertices = ear.graph.make_faces_vertices(crane);
  // crane.faces_edges = ear.graph.make_faces_edges(crane);
  // fs.writeFileSync("./tests/files/crane-faces-rebuilt.fold", JSON.stringify(crane), "utf8");

  // // console.log(ear.graph.make_vertices_vertices_vector(crane));
  // // console.log(ear.graph.make_vertex_pair_to_edge_map_directional(crane));
  // // console.log(crane.vertices_sectors);
});
