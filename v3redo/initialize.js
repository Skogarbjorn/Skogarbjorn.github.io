//import * as THREE from './three/three.js';
import { collision } from './collision.js';

export const laneSpeed = [];
export const carLanes = 5;
export const waterLanes = 5;
export const laneWidth = 16;

const numCars = carLanes*2;
const numLogs = waterLanes;
const numTurtles = waterLanes;

const carColors = [
	new THREE.Color( 0x352de9 ),
	new THREE.Color( 0xdca207 ),
	new THREE.Color( 0x6992ff ),
]

const car_size = new THREE.Vector3( 2, 0.9, 0.9 );
const log_size = new THREE.Vector3( 0.9, 0.9, 0.9 );
const turtle_size = new THREE.Vector3( 0.9, 0.2, 0.9 );
const player_size = new THREE.Vector3( 0.8, 0.8, 0.8 );
export const car_geometry = new THREE.BoxGeometry(
	car_size.x, 
	car_size.y,
	car_size.z 
);
export const player_geometry = new THREE.BoxGeometry(
	player_size.x, 
	player_size.y,
	player_size.z 
);

export function initPlayer(scene) {
	const material = new THREE.MeshPhongMaterial( { color: 0x44aa88 } );
	const player_cube = new THREE.Mesh( player_geometry.clone(), material );
	player_cube.translateZ(-1);
	scene.add( player_cube );
	return player_cube;
}

function initCars(scene) {
	const cars = [];
	for (let i = 0; i < carLanes; i++) { cars.push([]); }
    let material;
	let illegal;
	let lane;
	let numTries;
	for (let i = 0; i < numCars; i++) {
		illegal = true;

		material = new THREE.MeshPhongMaterial();
		material.color.set(carColors[i % carColors.length]);

		lane = Math.floor(Math.random()*carLanes);
		const car = new THREE.Mesh( car_geometry.clone(), material );

		numTries = 0;
		while (illegal) {
		    if (++numTries > 20) { console.log("oops"); break; }
			//if (laneSpeed[lane] > 0) car.rotateY(Math.pi/2);
			car.position.set(
				Math.random()*laneWidth-laneWidth/2,
				0.0,
				lane
			);

			illegal = false;
			for (let j = 0; j < cars[lane].length; j++) {
				if (collision(car, cars[lane][j])) {
					illegal = true;
					break;
				}
			}
		}
		if (numTries <= 20) {
			cars[lane].push(car);
			scene.add( car );
		}
	}
	return cars;
}

function initWater(scene) {
	const logs = [];
	for (let i = 0; i < waterLanes; i++) { logs.push([]); }
    let material = new THREE.MeshPhongMaterial( { color: 0x6b2d16 } );
	let geometry;
	let log;
	let illegal;
	let lane;
	let numTries = 0;
	for (let i = 0; i < numLogs; i++) {
		illegal = true;

		geometry = new THREE.BoxGeometry( 
			(Math.random()+1)*2,
			log_size.y,
		    log_size.z);
		lane = Math.floor(Math.random()*waterLanes);
		log = new THREE.Mesh( geometry, material );

		numTries = 0; while (illegal) {
			if (++numTries > 20) break;
			log.position.set(
				Math.random()*laneWidth-laneWidth/2,
				-0.7,
				lane + carLanes+1
			);

			illegal = false;
			for (let j = 0; j < logs[lane].length; j++) {
				const other_log = logs[lane][j];
				if (collision(log, other_log))
					illegal = true;
			}
		}
		if (numTries <= 20) {
			logs[lane].push( log );
			scene.add( log );
		}
	}


	let turtle;
	const turtles = [];
	for (let i = 0; i < waterLanes; i++) { turtles.push([]); }
    material = new THREE.MeshPhongMaterial( { color: 0x359340 } );

	for (let i = 0; i < numTurtles; i++) {
		illegal = true;

		geometry = new THREE.BoxGeometry( 
			Math.ceil((Math.random())*2),
			turtle_size.y,
		    turtle_size.z);
		lane = Math.floor(Math.random()*waterLanes);
		turtle = new THREE.Mesh( geometry, material );

		numTries = 0;
		while (illegal) {
			if (++numTries > 20) { console.log("oops"); break; }
			turtle.position.set(
				Math.random()*laneWidth-laneWidth/2,
				-0.4,
				lane + carLanes+1
			);

			illegal = false;
			for (let j = 0; j < logs[lane].length; j++) {
				const other_log = logs[lane][j];
				if (collision(turtle, other_log)) {
					illegal = true;
				    break;
				}
			}
			for (let j = 0; j < turtles[lane].length; j++) {
				const other_turtle = turtles[lane][j];
				if (collision(turtle, other_turtle)) {
					illegal = true;
					break;
				}
			}
		}
		if (numTries <= 20) {
			turtles[lane].push( turtle );
			scene.add( turtle );
		}
	}
	return [logs, turtles];
}

export function initialize_entities(scene) {
	for (let i = 0; i < carLanes+waterLanes+1; i++) {
		laneSpeed[i] = Math.random()/20+0.01;
		laneSpeed[i] = Math.random() < 0.5 ? -laneSpeed[i] : laneSpeed[i];
	}
	return [initPlayer(scene), initCars(scene)].concat(initWater(scene));
}
