/*
▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁
                    _     _     _ _
                   | |   | |   (_) |
          _ __ __ _| |__ | |__  _| |_    ___  __ _ _ __
         | '__/ _` | '_ \| '_ \| | __|  / _ \/ _` | '__|
         | | | (_| | |_) | |_) | | |_  |  __/ (_| | |
         |_|  \__,_|_.__/|_.__/|_|\__|  \___|\__,_|_|

█▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇██▇▆▅▄▃▂▁▁▂▃▄▅▆▇█
*/
// needed to check the environment
import { isWebWorker } from "./environment/detect";
// the library itself
import root from "./root";
// object-oriented style object constructors
import Constructors from "./classes/index";
// top level things
import math from "./math";
import diagram from "./diagrams/index";
import layer from "./layer/index";
import vertex from "./single_vertex/index";
import axiom from "./axioms/index";
import text from "./text/index";
import use from "./use/index";
/**
 * extensions
 * all extensions are optional, the library does not depend on them.
 * each implements a method called .linker() which is called by .use()
 *
 * to build Rabbit Ear without these extensions, comment out these lines
 * as well as the .use() method calls at the bottom of this file.
 */
/** convert a FOLD object into an SVG */
import foldToSVG from "./svg/index";
/** SVG drawing library with a lot of functionality */
import SVG from "./extensions/svg"; // replaces minified substitute
/** WebGL extension, draw FOLD objects into WebGL canvas. */
import * as webgl from "./webgl/fold-to-three";

const ear = Object.assign(root, Constructors, {
	math: math.core,
	axiom,
	diagram,
  layer,
	vertex,
	text,
	webgl,
});
/**
 * math is uniquely constructed where all the core methods are exposed
 * under ".math", and the top-level class-style objects will be attached
 * to this library's top level.
 */
Object.keys(math)
  .filter(key => key !== "core")
  .forEach((key) => { ear[key] = math[key]; });
/**
 * use() must bind this library to "this", as a way of making this library
 * mutable, so that the extension can bind itself throughout this library.
 */
Object.defineProperty(ear, "use", {
	enumerable: false,
	value: use.bind(ear),
});
/**
 * binding the extensions must happen after the library has been initialized.
 */
if (!isWebWorker) {
  ear.use(foldToSVG); // must happen before SVG
  ear.use(SVG);
}

export default ear;
