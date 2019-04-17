/**
 * .FOLD file into SVG, and back
 */

import * as SVG from "../../include/svg";
import { get_boundary_vertices, faces_coloring } from "../fold/graph";

const CREASE_DIR = {
	"B": "boundary", "b": "boundary",
	"M": "mountain", "m": "mountain",
	"V": "valley",   "v": "valley",
	"F": "mark",     "f": "mark",
	"U": "mark",     "u": "mark"
};

export const fill_svg_groups = function(graph, boundaryGroup, facesGroup, creasesGroup, verticesGroup) {
	boundary(graph).forEach(b => boundaryGroup.appendChild(b));
	faces(graph).forEach(f => facesGroup.appendChild(f));
	creases(graph).forEach(c => creasesGroup.appendChild(c));
	vertices(graph).forEach(v => verticesGroup.appendChild(v));
}

export const boundary = function(graph) {
	let boundary = get_boundary_vertices(graph)
		.map(v => graph.vertices_coords[v])
	return [SVG.polygon(boundary).setClass("boundary")];
};

export const vertices = function(graph, options) {
	let radius = options && options.radius ? options.radius : 0.01;
	return graph.vertices_coords.map((v,i) =>
		SVG.circle(v[0], v[1], radius)
			.setClass("vertex")
			.setID(""+i)
	);
};

export const creases = function(graph) {
	let edges = graph.edges_vertices
		.map(ev => ev.map(v => graph.vertices_coords[v]));
	let eAssignments = graph.edges_assignment.map(a => CREASE_DIR[a]);
	return edges.map((e,i) =>
		SVG.line(e[0][0], e[0][1], e[1][0], e[1][1])
			.setClass(eAssignments[i])
			.setID(""+i)
	);
};

export const facesVertices = function(graph) {
	let fAssignments = graph.faces_vertices.map(fv => "face");
	let facesV = !(graph.faces_vertices) ? [] : graph.faces_vertices
		.map(fv => fv.map(v => graph.vertices_coords[v]))
		// .map(face => Geom.Polygon(face));
	// facesV = facesV.map(face => face.scale(0.6666));
	return facesV.filter(f => f != null).map((face, i) =>
		SVG.polygon(face)
			.setClass(fAssignments[i])
			.setID(""+i)
	);
};

export const facesEdges = function(graph) {
	let fAssignments = graph.faces_vertices.map(fv => "face");
	let facesE = !(graph.faces_edges) ? [] : graph.faces_edges
		.map(face_edges => face_edges
			.map(edge => graph.edges_vertices[edge])
			.map((vi,i,arr) => {
				let next = arr[(i+1)%arr.length];
				return (vi[1] === next[0] || vi[1] === next[1]
					? vi[0] : vi[1]);
			}).map(v => graph.vertices_coords[v])
		)
		// .map(face => Geom.Polygon(face));
	// facesE = facesE.map(face => face.scale(0.8333));
	return facesE.filter(f => f != null).map((face, i) =>
		SVG.polygon(face)
			.setClass(fAssignments[i])
			.setID(""+i)
	);
};

function faces_sorted_by_layer(faces_layer) {
	return faces_layer.map((layer,i) => ({layer:layer, i:i}))
		.sort((a,b) => a.layer-b.layer)
		.map(el => el.i)
}

export const faces = function(graph) {
	let facesV = graph.faces_vertices
		.map(fv => fv.map(v => graph.vertices_coords[v]))
		// .map(face => Geom.Polygon(face));
	let notMoving = 0;
	// if (graph["re:faces_to_move"] != null) {
	// 	let faces_to_move = graph["re:faces_to_move"].indexOf(false);
	// 	if (faces_to_move !== -1) { notMoving = faces_to_move; }
	// }
	if (graph["re:face_stationary"] != null) {
		notMoving = graph["re:face_stationary"];
	}
	// if (graph["re:faces_coloring"] && graph["re:faces_coloring"].length > 0) {

	// let coloring = faces_coloring(graph, notMoving);
	let coloring = graph["re:faces_coloring"];
	if (coloring == null) {
		coloring = faces_coloring(graph, notMoving);
	}

	let order = graph["re:faces_layer"] != null
		? faces_sorted_by_layer(graph["re:faces_layer"])
		: graph.faces_vertices.map((_,i) => i);
	return order.map(i =>
		SVG.polygon(facesV[i])
			.setClass(coloring[i] ? "front" : "back")
			// .setClass(coloring[i] ? "face-front-debug" : "face-back-debug")
			.setID(""+i)
	);
	// if (graph["re:faces_layer"] && graph["re:faces_layer"].length > 0) {
	// 	return graph["re:faces_layer"].map((fi,i) =>
	// 		SVG.polygon(facesV[fi])
	// 			.setClass(i%2==0 ? "face-front" : "face-back")
	// 			.setID(""+i)
	// 	);
	// } else {
	// 	return facesV.map((face, i) =>
	// 		SVG.polygon(face)
	// 			.setClass("folded-face")
	// 			.setID(""+i)
	// 		);
	// }
}

export const getPageCSS = function() {
	let css = [];
	for (let sheeti = 0; sheeti < document.styleSheets.length; sheeti++) {
		let sheet = document.styleSheets[sheeti];
		let rules = ('cssRules' in sheet) ? sheet.cssRules : sheet.rules;
		for (let rulei = 0; rulei < rules.length; rulei++) {
			let rule = rules[rulei];
			if ('cssText' in rule){
				css.push(rule.cssText);
			}
			else{
				css.push(rule.selectorText+' {\n'+rule.style.cssText+'\n}\n');
			}
		}
	}
	return css.join('\n');
}

