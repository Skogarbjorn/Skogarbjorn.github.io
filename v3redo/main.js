import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls1/OrbitControls.js';
import { collision, player_collision } from './collision.js';
import { laneSpeed, laneWidth, carLanes, waterLanes, car_geometry, player_geometry, initPlayer, initialize_entities, spawnFly } from './initialize.js';
import { map } from './map.js';

const scene = new THREE.Scene();

const camera1 = new THREE.PerspectiveCamera( 80,
	window.innerWidth/window.innerHeight, 0.1, 1000 );
const camera2 = new THREE.PerspectiveCamera( 80,
	window.innerWidth/window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const light = new THREE.DirectionalLight(0xFc93f6, 4);
light.position.set(-20, 20, -20);
scene.add( light );

const light2 = new THREE.DirectionalLight(0xfc748d, 2);
light2.position.set(0, 10, 20);
scene.add( light2 );

const light3 = new THREE.DirectionalLight(0xFFFFFF, 3);
light3.position.set(20, 20, -20);
scene.add( light3 );

const controls1 = new OrbitControls( camera1, renderer.domElement );
controls1.enableRotate = false;
const controls2 = new OrbitControls( camera2, renderer.domElement );
controls2.enableRotate = false;

export const player_pos = new THREE.Vector3( 0.0, 0.0, -1.0 );

camera1.position.set(-1, 4, -5 );
controls1.update();

let view = 1;

let [player, cars, logs, turtles] = initialize_entities(scene);
let flies = [];
let alive = true;
let moving = true;
let winners = 0;

let points = 0;

window.onload = function init()
{ 

	window.addEventListener("keydown", function(e) {
		if (alive && moving) {
			switch( e.keyCode ) {
				case 40:
					if (legal(player_pos.x,
						player_pos.z - 1))
						player_pos.z--;
					break;
				case 38:
					if (legal(player_pos.x,
						player_pos.z + 1)) {
						if (++player_pos.z > carLanes+waterLanes) {
							map[Math.round(player_pos.z)+2]
							[Math.round(player_pos.x)+laneWidth/2] = false;
							player_pos.x = Math.round(player_pos.x);
							moving = false;
							console.log("You got a frog over! +5 points");
							setTimeout(() => {
								if (++winners == 4) win();
								else {
									points += 5;
									moving = true;
									player = initPlayer(scene);
									player_pos.set( 0, 0, -1);
								}
							}, 1500);
						}
					}
					break;
				case 37:
					if (legal(player_pos.x + 1,
						player_pos.z))
						player_pos.x++;
					break;
				case 39:
					if (legal(player_pos.x - 1,
						player_pos.z))
						player_pos.x--;
					break;
				case 49:
					view = 1;
					break;
				case 50:
					view = 2;
					break;
			}
		}
	});

	smooth();
	tick();
}

function win() {
	if (points < 0) console.log("Yeah, i guess you won. Pretty sad that you ended up in the negatives with ", points, " points...");
	else console.log("You win! You got ", points, " points!");
}

function legal(x, z) {
	return map[Math.round(z)+2][Math.round(x)+laneWidth/2];
}

function smooth() {
	player.position.x += (player_pos.x - player.position.x)/4;
	player.position.y += (player_pos.y - player.position.y)/4;
	player.position.z += (player_pos.z - player.position.z)/4;
	if (alive) {
		camera1.position.z = player.position.z - 4;
		camera2.position = player.position;
	}

	setTimeout(() => {
		smooth();
	}, 10);
}

function tick() {
	for (let i = 0; i < cars.length; i++) {
		for (let j = 0; j < cars[i].length; j++) {
			const car = cars[i][j];
			car.translateX(laneSpeed[i], 0, 0);
			if (Math.abs(car.position.x) > laneWidth/2) {
				car.translateX(-car.position.x*2);
			}
		}
	}
	for (let i = 0; i < logs.length; i++) {
		for (let j = 0; j < logs[i].length; j++) {
			const log = logs[i][j];
			log.translateX(laneSpeed[i+carLanes+1], 0, 0);
			if (Math.abs(log.position.x) > laneWidth/2) {
				log.translateX(-log.position.x*2);
			}
		}
	}
	for (let i = 0; i < turtles.length; i++) {
		for (let j = 0; j < turtles[i].length; j++) {
			const turtle = turtles[i][j];
			turtle.translateX(laneSpeed[i+carLanes+1], 0, 0);
			if (Math.abs(turtle.position.x) > laneWidth/2) {
				turtle.translateX(-turtle.position.x*2);
			}
			if (Math.random() < 0.001 && !(turtle.position.y < -0.4)) {
				sink(turtle);
			}
		}
	}
	for (let i = 0; i < flies.length; i++) {
		if (player_collision(flies[i])) {
			points++;
			console.log("You ate a fly! +1 point");
			scene.remove(flies[i]);
			flies.splice(i, 1);
		}
	}
	if (player_pos.z > carLanes && player_pos.z <= carLanes+waterLanes) {
		alive = false;
		for (let i = 0; i < logs[player_pos.z-carLanes-1].length; i++) {
			if (player_collision(logs[player_pos.z-carLanes-1][i])) {
			    alive = true;
				break;
			} 
		}
		if (!alive) {
			for (let i = 0; i < turtles[player_pos.z-carLanes-1].length; i++) {
				if (player_collision(turtles[player_pos.z-carLanes-1][i])) {
					alive = true;
					break;
				}
			}
		}
	} else if (0 <= player_pos.z && player_pos.z < carLanes) {
		for (let i = 0; i < cars[player_pos.z].length; i++) {
			if (player_collision(cars[player_pos.z][i])) {
				alive = false;
			}
		}
	}
	if (player_pos.z <= carLanes + waterLanes &&player_pos.z > carLanes && alive) {
        player_pos.x += laneSpeed[Math.round(player_pos.z)];
	} 
	if (Math.random() < 0.005) flies.push(spawnFly(scene));
	setTimeout(() => {
		if (!alive) death();
		else tick();
	}, 10);
}

function death() {
	points--;
	console.log("You lost a point!");
	setTimeout(() => {
		alive = true;
		player_pos.set(0, 0, -1);
		tick();
	}, 1000);
	//dramaticDeath();
}

function dramaticDeath() {
	camera1.zoom -= 0.1;
	setTimeout(() => {
		if (!alive) dramaticDeath();
		else camera1.position.set(-1, 4, -5 );
	}, 10);
}

function sink(turtle) {
	turtle.position.y -= 0.01;
	setTimeout(() => {
		if (turtle.position.y < -2) float(turtle);
		else sink(turtle);
	}, 10);
}
function float(turtle) {
	turtle.position.y += 0.01;
	setTimeout(() => {
		if (turtle.position.y > -0.4) turtle.position.y = -0.4;
		else float(turtle);
	}, 10);
}

function animate() {
	controls1.target.set(
		player.position.x, 
		player.position.y, 
		player.position.z);
	controls1.update();
	if (view == 1) renderer.render( scene, camera1 );
	if (view == 2) renderer.render( scene, camera2 );
}
renderer.setAnimationLoop( animate );
