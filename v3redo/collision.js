import * as THREE from 'three';
import { player_geometry } from "./initialize.js";
import { player_pos } from "./main.js";

export function collision(a, b) {
	const abox = new THREE.Box3().setFromObject(a);
	const bbox = new THREE.Box3().setFromObject(b);
	return abox.intersectsBox(bbox);
}

export function player_collision(bobj) {
	const a = player_pos;
	const al = player_geometry.parameters.width;
	const b = bobj.position;
	const bl = bobj.scale.x;
	if (b.y < -1) return false;
	if (Math.abs(a.z - b.z) > 1E-6) return false;
	return a.x + al/2 > b.x - bl/2 &&
		a.x - al/2 < b.x + bl/2;
}
