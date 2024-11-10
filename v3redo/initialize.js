import * as THREE from 'three';
import { collision } from './collision.js';
import { map } from './map.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export const laneSpeed = [];
export const carLanes = 5;
export const waterLanes = 5;
export const laneWidth = 16;

const numCars = carLanes*2;
const numLogs = waterLanes+3;
const numTurtles = waterLanes+3;

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

function initWalls(scene) {
	const material = new THREE.MeshPhongMaterial( { color: 0x2b513d } );
	const geometry = new THREE.BoxGeometry( 1, 1, 1 );
	for (let i = 0; i < map.length; i++) {
		for (let j = 0; j < map[i].length; j++) {
			if (!map[i][j]) {
				const wall = new THREE.Mesh( geometry, material );
				wall.position.set(j-laneWidth/2, -0.5, i-2);
				scene.add(wall);
			}
		}
	}
}

export function initPlayer(scene) {
	let player;
	loader.load( './assets/log.glb', function ( gltf ) {
		player = gltf.scene;
		player.translateZ(-1);
		scene.add( player );
		}, undefined, function ( error ) {
				console.error( error ); });
	return player;
}

function initCars(scene) {
	const cars = [];
	for (let i = 0; i < carLanes; i++) { cars.push([]); }
    let material;
	let illegal;
	let lane;
	let numTries;
	for (let i = 0; i < numCars; i++) {
		loader.load( './assets/car.glb', function ( gltf ) {
			illegal = true;
			const car = gltf.scene;

			lane = Math.floor(Math.random()*carLanes);

			numTries = 0;
			while (illegal) {
				if (++numTries > 20) { break; }
				car.position.set(
					Math.random()*laneWidth-laneWidth/2,
					0.0,
					lane
				);
				car.traverse((object) => {
					if (object.name == "Cube") {
						object.material.color.set(carColors[i%carColors.length])
					}
				});

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
		}, undefined, function ( error ) {
				console.error( error ); });
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
		loader.load( './assets/log.glb', function ( gltf ) {
			illegal = true;
			log = gltf.scene;
			log.scale.set((Math.random()+1)*2, 0.9, 0.9);

			lane = Math.floor(Math.random()*waterLanes);

			numTries = 0; 
			while (illegal) {
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
		}, undefined, function ( error ) {
				console.error( error ); });
	}


	let turtle;
	const turtles = [];
	for (let i = 0; i < waterLanes; i++) { turtles.push([]); }
    material = new THREE.MeshPhongMaterial( { color: 0x359340 } );

	for (let i = 0; i < numTurtles; i++) {
		loader.load( './assets/croc.glb', function ( gltf ) {
			illegal = true;

			turtle = gltf.scene;
			turtle.scale.set( Math.ceil(Math.random()*2 ), 0.9, 0.9);

			lane = Math.floor(Math.random()*waterLanes);

			numTries = 0;
			while (illegal) {
				if (++numTries > 20) { break; }
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
		}, undefined, function ( error ) {
				console.error( error ); });
	}
	return [logs, turtles];
}

function initGround(scene) {
	const street_material = new THREE.MeshPhongMaterial( {
		color: 0x444444,
	    side: THREE.DoubleSide
	} );
	const street_geometry = new THREE.PlaneGeometry( laneWidth, carLanes );
	const street = new THREE.Mesh( street_geometry, street_material );
	street.translateZ(2);
	street.translateY(-0.5);
	street.rotateX(Math.PI/2);
	scene.add( street );
	const sidewalk_material = new THREE.MeshPhongMaterial( {
		color: 0x808182,
	} );
	const sidewalk_geometry = new THREE.BoxGeometry( laneWidth, 0.1, 1 );
	const sidewalk = new THREE.Mesh( sidewalk_geometry, sidewalk_material );
	sidewalk.translateY(-0.45);
	sidewalk.translateZ(-1);
	scene.add( sidewalk.clone() );
	sidewalk.translateZ(carLanes+1);
	scene.add( sidewalk.clone() );
	sidewalk.translateZ(waterLanes+0.9);
	scene.add( sidewalk );
	const water_material = new THREE.MeshPhongMaterial( {
		color: 0x0e80b5,
	    side: THREE.DoubleSide,
		shininess: 300,
	} );
	console.log(water_material.reflectivity);
	const water_geometry = new THREE.PlaneGeometry( laneWidth, waterLanes );
	const water = new THREE.Mesh( water_geometry, water_material );
	water.translateY(-0.5);
	water.translateZ(carLanes+3);
	water.rotateX(Math.PI/2);
	scene.add( water );
}

export function spawnFly(scene) {
    const material = new THREE.MeshPhongMaterial( {
		color: 0xabcdef,
	} );
	const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
	const fly = new THREE.Mesh( geometry, material );
	fly.position.set( Math.random()*(laneWidth-4)-(laneWidth-2)/2, 0.25,
		Math.floor(Math.random()*waterLanes+carLanes+1));
	scene.add( fly );
	return fly;
}

export function initialize_entities(scene) {
	for (let i = 0; i < carLanes+waterLanes+1; i++) {
		laneSpeed[i] = Math.random()/20+0.01;
		laneSpeed[i] = Math.random() < 0.5 ? -laneSpeed[i] : laneSpeed[i];
	}
	initWalls(scene);
	initGround(scene);
	return [initPlayer(scene), initCars(scene)].concat(initWater(scene));
}
