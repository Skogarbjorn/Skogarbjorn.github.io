//import { player_geometry } from "./initialize.js";
//import { player_pos } from "./main.js";

function collision(a, b) {
	const apos = a.position;
	const bpos = b.position;
	const al = a.geometry.parameters.width;
	const bl = b.geometry.parameters.width;
	if (Math.abs(apos.z - bpos.z) > 1E-6 ) return false;
    return apos.x + al/2 > bpos.x - bl/2 &&
		apos.x - al/2 < bpos.x + bl/2;
}

function player_collision(bobj) {
	const a = player_pos;
	const al = player_geometry.parameters.width;
	const b = bobj.position;
	const bl = bobj.geometry.parameters.width;
	if (b.y < -1) return false;
	if (Math.abs(a.z - b.z) > 1E-6) return false;
	return a.x + al/2 > b.x - bl/2 &&
		a.x - al/2 < b.x + bl/2;
}
