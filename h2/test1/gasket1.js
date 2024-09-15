"use strict";

var gl;
var canvas;

var movement = false;
var current_pos = 0;

var points = [
	vec2(0.0, -0.8),
	vec2(0.2, -1),
	vec2(-0.2, -1)
]

var birds = 0;
const bird_len = 0.1;
var birds_index = 3;
var birds_speed = [];

var shots = 0;
const shot_len = 0.05;
const shot_index = 3;
const shot_speed = 0.03;

var hits = 0;
var hits_pos = 0.9;
var hits_index = 3;
const hits_len = 0.03;
const hits_offs = 0.06;
const hits_height = 0.3;

const game_speed = 10;
const collision_speed = 50;

window.onload = function init()
{
	canvas = document.getElementById( "gl-canvas" );

	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }


	//
	//  Configure WebGL
	//
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	//  Load shaders and initialize attribute buffers

	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	// Load the data into the GPU

	var bufferId = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	// Associate out shader variables with our data buffer

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	collision_loop();
	game_loop();
};

window.addEventListener('mousedown', function press(event) {
	movement = true;
	current_pos = event.offsetX;
});

window.addEventListener('mouseup', function release() {
	movement = false;
});

window.addEventListener('mousemove', function move(event) {
	if ( movement ) {
		var relative_pos = 2*(event.offsetX - current_pos)/canvas.width;
		current_pos = event.offsetX;
		for ( var i = 0; i < 3; i++ ) {
			points[i][0] += relative_pos;
		}

		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
	}
});

window.addEventListener('keydown', function shoot(event) {
	if (String.fromCharCode(event.keyCode) == ' ' && shots < 3) {
		var start_pos = points[0][0]-shot_len/2;
		points.splice(birds_index, 0, vec2(start_pos, -1.0));
		points.splice(birds_index, 0, vec2(start_pos, -1.0 + shot_len));
		points.splice(birds_index, 0, vec2(start_pos + shot_len, -1.0+shot_len));
		points.splice(birds_index, 0, vec2(start_pos + shot_len, -1.0));
		shots += 1;
		birds_index += 4;
		hits_index += 4;
		gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	}
});

function process_all_shots() {
	for (var i = 0; i < shots; i++) {
		process_individual_shot(shot_index + i*4);
	}
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}

function process_individual_shot(index) {
	for ( var i = index; i < index+4; i++ ) {
		points[i][1] += shot_speed;
		if ( points[i][1] > 1.1 ) {
			shots -= 1;
			birds_index -= 4;
			hits_index -= 4;
			points.splice(index, 4);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
			break;
		}
	}
}

function process_all_birds() {
	for (var i = 0; i < birds; i++) {
		process_individual_birds(birds_index + i*4, i);
	}
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}

function process_individual_birds(index, num) {
	for ( var i = index; i < index+4; i++ ) {
		points[i][0] += birds_speed[num];
		if ( points[i][0] > 1.1 ) {
			birds -= 1;
			hits_index -= 4;
			points.splice(index, 4);
			birds_speed.splice(num, 1);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
			break;
		}
	}
}

function try_to_spawn_bird() {
	if ( Math.random() < 0.01 ) {
		spawn_bird();
	}
}

function spawn_bird() {
	var height = Math.random()/2 + 0.4;
	points.splice(hits_index, 0, vec2(-1.0,	         height));
	points.splice(hits_index, 0, vec2(-1.0+bird_len, height));
	points.splice(hits_index, 0, vec2(-1.0+bird_len, height+bird_len));
	points.splice(hits_index, 0, vec2(-1.0,          height+bird_len));
	birds += 1;
	birds_speed.push(Math.random()/50+0.005);
	hits_index += 4;
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function spawn_hit() {
	points.push(vec2(hits_pos,            0.8), 
				vec2(hits_pos + hits_len, 0.8),
				vec2(hits_pos + hits_len, 0.8 + hits_height),
				vec2(hits_pos,            0.8 + hits_height))
	hits += 1;
	hits_pos -= hits_offs;
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function collision(index) {
	let pos = points[index];
	if (pos[1] >= 0.5) {
		for (var i = 0; i < birds; i++) {
			let pos_bird = points[birds_index + i*4];
			if (pos[0] < pos_bird[0] + bird_len &&
				pos[0] + shot_len > pos_bird[0] &&
				pos[1] < pos_bird[1] + bird_len &&
				pos[1] + shot_len > pos_bird[1]) {

				birds -= 1;
				shots -= 1;
				birds_speed.splice(i, 1);
				points.splice(birds_index + 4*i, 4);
				points.splice(index, 4);
				birds_index -= 4;
				hits_index -= 8;
				spawn_hit();
				break;
			}
		}
	}
}

function collision_loop() {
	setTimeout( function() {
		for (var i = 0; i < shots; i++) {
			collision(shot_index + 4*i);
		}
		collision_loop();
	}, collision_speed);
}

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );

	gl.drawArrays(gl.TRIANGLE_FAN, 0, 3);
	for (var i = 0; i < shots; i++) {
		gl.drawArrays(gl.TRIANGLE_FAN, shot_index + i*4, 4);
	}
	for (var i = 0; i < birds; i++) {
		gl.drawArrays(gl.TRIANGLE_FAN, birds_index + i*4, 4);
	}
	for (var i = 0; i < hits; i++) {
		gl.drawArrays(gl.TRIANGLE_FAN, hits_index + i*4, 4);
	}
}

function game_loop() {
	render();

	process_all_shots();
	process_all_birds();
	
	try_to_spawn_bird();

	setTimeout ( function () {
		if (hits < 5) {
			requestAnimFrame(game_loop);
		} else {
			render();
		}
	}, game_speed);
}
