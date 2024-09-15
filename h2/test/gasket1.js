"use strict";

var gl;
var canvas;
var counter;

var points = [
        vec2( -0.2, -1.0 ),
        vec2( 0.2, -1.0 ),
        vec2(  0.0,  -0.8 ),
    ];

var movement = false;
var current_pos;

var shots=0;
const shot_speed = 0.03;
var shot_len = 0.05;
var birds=0;
const bird_speed = 0.01;
var bird_len = 0.1;

var hits = 0;

const game_speed = 10;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
	counter = document.getElementById( "counter" );

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

    game();

	shotCollision();
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
		var start_pos = points[2][0]-0.025;
		points.splice(3+(shots)*4, 0, vec2(start_pos, -1.0));
		points.splice(3+(shots)*4+1, 0, vec2(start_pos, -1.0+shot_len));
		points.splice(3+(shots)*4+2, 0, vec2(start_pos + shot_len, -1.0));
		points.splice(3+(shots)*4+3, 0, vec2(start_pos + shot_len, -1.0+shot_len));
		shots += 1;
		gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	}
});

function shot_function(index) {
	for ( var i = index; i < index+4; i++ ) {
		points[i][1] += shot_speed;
		if ( points[i][1] > 1.1 ) {
			shots -= 1;
			points.splice(index, 4);
			break;
		}
	}
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}
function bird_function(index) {
	for ( var i = index; i < index+4; i++ ) {
		points[i][0] += bird_speed;
		if ( points[i][0] > 1.1 ) {
			birds -= 1;
			points.splice(index, 4);
			break;
		}
	}
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}

function spawn_bird() {
	var height = Math.random();
	if ( Math.random() > 0.5 ) {
		var left_right = -1.0;
	} else {
		var left_right = -1.0;
	}
	points.push(vec2(left_right, height),
				vec2(left_right, height + bird_len),
				vec2(left_right + bird_len, height),
				vec2(left_right + bird_len, height + bird_len));
	birds += 1;
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function shotCollision() {
	for ( var i = 3; i < 3 + 4*shots; i += 4 ) {
		for ( var j = 3 + 4*shots; j < 3 + 4*(shots + birds); j += 4 ) {
			var hit = checkCollision(points[i], points[j]);
			if ( hit ) {
				counter.innerHTML = ++hits + " birds shot";
				points.splice(j, 4);
				birds--;
				points.splice(i, 4);
				shots--;
				break;
			}
		}
	}

	setTimeout( function() {
		shotCollision();
	}, 50);
}

function checkCollision( x, y ) {
	console.log(bird_map);
	return x[0] < y[0] + bird_len &&
		   x[0] + shot_len > y[0] &&
		   x[1] < y[1] + bird_len &&
		   x[1] + shot_len > y[1];
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( gl.TRIANGLES, 0, 3);
	for ( var i = 0; i < shots+birds; i++ ) {
		gl.drawArrays( gl.TRIANGLE_STRIP, 3+i*4, 4);
	}
}

function game() {
	render();

	for ( var i = 0; i < shots; i++ ) {
		shot_function(3+i*4);
	}
	for ( var i = 0; i < birds; i++ ) {
		bird_function(3+(shots+i)*4);
	}

	var rand = Math.random();
	if ( rand < 0.01 ) {
		spawn_bird();
	}

	setTimeout ( function () {
		requestAnimFrame(game);
	}, game_speed);
}

