const ear = require("../rabbit-ear");

test("solver", () => {
  const sectors = [12, 11, 6, 2, 3, 4, 5, 9];
  const assignments = ["V", "V", "V", "M", "V", "V", "M", "M"];
  ear.layer.single_vertex_solver(sectors, assignments);
});

// const seeds = [10, 6, 4, 1, 2, 9];
// const assignments = ["V", "V", "V", "M", "M", "V"];
