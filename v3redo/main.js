//import * as THREE from './three/three.js';
//import { collision, player_collision } from './collision.js';
//import { laneSpeed, laneWidth, carLanes, waterLanes, car_geometry, player_geometry, initPlayer, initialize_entities } from './initialize.js';
//import { map } from './map.js';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 100,
	window.innerWidth/window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const light = new THREE.DirectionalLight(0xFFFFFF, 5);
light.position.set(-20, 20, -20);
scene.add( light );

const light2 = new THREE.DirectionalLight(0xFFFFFF, 2);
light2.position.set(0, 20, 20);
scene.add( light2 );

const light3 = new THREE.DirectionalLight(0xFFFFFF, 3);
light3.position.set(20, 20, -20);
scene.add( light3 );

const controls = new OrbitControls( camera, renderer.domElement );

const player_pos = new THREE.Vector3( 0.0, 0.0, -1.0 );

camera.position.set(-1, 4, -5 );
controls.update();

let [player, cars, logs, turtles] = initialize_entities(scene);
let alive = true;
let winners = 0;

window.onload = function init()
{ 

	window.addEventListener("keydown", function(e) {
		if (alive) {
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
							player_pos.z = Math.round(player_pos.z);
							setTimeout(() => {
								if (++winners == 4) win();
								else {
									player = initPlayer(scene);
									player_pos.set( 0, 0, -1);
								}
							}, 300);
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
			}
		}
	});

	smooth();
	tick();
}

function win() {
	console.log("you win");
}

function legal(x, z) {
	return map[Math.round(z)+2][Math.round(x)+laneWidth/2];
}

function smooth() {
	player.position.x += (player_pos.x - player.position.x)/4;
	player.position.y += (player_pos.y - player.position.y)/4;
	player.position.z += (player_pos.z - player.position.z)/4;
	if (alive) camera.position.z = player.position.z - 4;

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
	if (player_pos.z > carLanes) {
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
	if (player_pos.z > carLanes && alive) {
        player_pos.x += laneSpeed[Math.round(player_pos.z)];
	} 
	setTimeout(() => {
		if (!alive) death();
		else tick();
	}, 10);
}

function death() {
	setTimeout(() => {
		alive = true;
		player_pos.set(0, 0, -1);
		tick();
	}, 1000);
	dramaticDeath();
}

function dramaticDeath() {
	camera.zoom -= 0.1;
	setTimeout(() => {
		if (!alive) dramaticPan();
		else camera.position.set(-1, 4, -5 );
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
	controls.target.set(
		player.position.x, 
		player.position.y, 
		player.position.z);
	controls.update();
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
