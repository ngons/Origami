/**
 * Rabbit Ear (c) Robby Kraft
 */
export const shouldNotBeHere = (fn) => console
	.warn(`${fn.name ? fn.name : fn}: shouldn't be here`);
