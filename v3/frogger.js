var canvas;
var gl;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var YELLOW = vec4(1.0, 1.0, 0.1, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);

var numCubeVertices  = 36;

// variables for moving car
var carDirection = 0.0;
var carXPos = 100.0;
var carYPos = 0.0;
var height = 0.0;
var carLength = 10.0;
var logLength = 3.0;
var playerLength = 2.75;
var lilyLength = 3.0;
var numCars = 10;
var numLogs = 7;
var numLilies = 7;

var laneSpeed = [0.2,0.4,0.3,0.6]
var streamSpeed = [0.3,0.2,0.4,0.3,0.1]

var carPos = [];
var logPos = [];
var lilyPos = [];
var playerPos = [];

var onLog = true;
var dead = false;

// current viewpoint
var view = 1;

var movement = false;
var origX;
var origY;
var spinZ = 0;
var spinY = 0;

var colorLoc;
var mvLoc;
var pLoc;
var proj;

var cubeBuffer;
var vPosition;

// the 36 vertices of the cube
var cVertices = [
	// front side:
	vec3( -0.5,  0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ),
	vec3(  0.5, -0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ),
	// right side:
	vec3(  0.5,  0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ), vec3(  0.5, -0.5, -0.5 ),
	vec3(  0.5, -0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ), vec3(  0.5,  0.5,  0.5 ),
	// bottom side:
	vec3(  0.5, -0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3( -0.5, -0.5, -0.5 ),
	vec3( -0.5, -0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3(  0.5, -0.5,  0.5 ),
	// top side:
	vec3(  0.5,  0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3( -0.5,  0.5,  0.5 ),
	vec3( -0.5,  0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3(  0.5,  0.5, -0.5 ),
	// back side:
	vec3( -0.5, -0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ),
	vec3(  0.5,  0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ),
	// left side:
	vec3( -0.5,  0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ), vec3( -0.5, -0.5,  0.5 ),
	vec3( -0.5, -0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ), vec3( -0.5,  0.5, -0.5 )
];


window.onload = function init()
{
	canvas = document.getElementById( "gl-canvas" );

	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.7, 1.0, 0.7, 1.0 );

	gl.enable(gl.DEPTH_TEST);

	initCars();
	initLogs();
	initLilies();
	playerPos = [0.0, 0.0];

	//
		//  Load shaders and initialize attribute buffers
	//
		var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	// VBO for the cube
	cubeBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW );


	vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	colorLoc = gl.getUniformLocation( program, "fColor" );

	mvLoc = gl.getUniformLocation( program, "modelview" );

	// set projection
	pLoc = gl.getUniformLocation( program, "projection" );
	proj = perspective( 50.0, 1.0, 1.0, 500.0 );
	gl.uniformMatrix4fv(pLoc, false, flatten(proj));

	window.addEventListener("mousedown", function(e) {
		movement = true;
		origX = e.offsetX;
		origY = e.offsetY;
		e.preventDefaul();
	});
	window.addEventListener("mouseup", function() {
		movement = false;
	});
	window.addEventListener("mousemove", function(e) {
		if(movement) {
			spinZ = ( spinZ - (origX - e.offsetX) ) % 360;
			spinY = ( spinY - (origY - e.offsetY) ) % 360;
			origX = e.offsetX;
			origY = e.offsetY;
		}
	});

	// Event listener for keyboard
	window.addEventListener("keydown", function(e){
		console.log("pressed key");
		switch( e.keyCode ) {
			case 49:	// 1: behind frog
				view = 1;
				break;
			case 50:	// 2: frog pov
				view = 2;
				break;
			case 40:
				playerPos[1] -= 4;
				break;
			case 38:
				playerPos[1] += 4;
				break;
			case 37:
				playerPos[0] -= 4;
				break;
			case 39:
				playerPos[0] += 4;
				break;
		}
	} );

	tick();
	render();
}

function initCars() {
	var pos;
	var illegal;
	for (var i = 0; i < numCars; i++) {
		illegal = true;
		while (illegal) {
			pos = [
				Math.random() * 100 - 50,     // X-pos
				Math.ceil(Math.random()*4)*4, // Y-row
				vec4(Math.random(), Math.random(), Math.random(), 1.0), // Color
			];
			illegal = false;

			for (var j = 0; j < i; j++) {
				if (collision(pos, carPos[j], carLength, carLength)) {
					illegal = true;
					break;
				} else {
					illegal = false;
				}
			}
		}
		carPos.push(pos);
	}
}

function initLogs() {
	var pos;
	var illegal;
	for (var i = 0; i < numCars; i++) {
		illegal = true;
		while (illegal) {
			pos = [
				Math.random() * 100 - 50,        // X-position
				Math.ceil(Math.random()*5)*4+20,    // Y-position
				Math.ceil((Math.random()+0.5)*4),  // Length
			];
			illegal = false;

			for (var j = 0; j < i; j++) {
				if (collision(pos, logPos[j], pos[2]*logLength, logPos[j][2]*logLength)) {
					illegal = true;
					break;
				} else {
					illegal = false;
				}
			}
		}
		logPos.push(pos);
	}
}

function initLilies() {
	var pos;
	var illegal;
	for (var i = 0; i < numLilies; i++) {
		illegal = true;
		while (illegal) {
			pos = [
				Math.random() * 100 - 50,             // X-position
				Math.ceil(Math.random()*5)*4+20,         // Y-row
				Math.ceil(Math.random()*2)+1,         // Length
				Math.random() > 0.1 ? true : false,   // Sinks
				0.0,                                  // Height if sinks
			];
			illegal = false;

			for (var j = 0; j < numLogs; j++) {
				if (collision(pos, logPos[j], pos[2]*logLength, logPos[j][2]*logLength)) {
					illegal = true;
					break;
				} else {
					illegal = false;
				}
			}
			if (!illegal) {
				for (var j = 0; j < i; j++) {
					if (collision(pos, lilyPos[j], pos[2]*lilyLength, lilyPos[j][2]*lilyLength)) {
						illegal = true;
						break;
					} else {
						illegal = false;
					}
				}
			}
		}
		lilyPos.push(pos);
		if (lilyPos[i][3]) sinkTimer(i, (Math.random()/2 + 0.5)*20000);
	}
}

function collision(a, b, al, bl) {
	var ax = a[0];
	var bx = b[0];
	var ay = a[1];
	var by = b[1];
	return ay == by &&
		ax + al/2 > bx - bl/2 &&
		ax - al/2 < bx + bl/2;
}

function isFloating(obj) {
	var logx = obj[0];
	var logy = obj[1];
	var length = obj[2];
	return playerPos[1] == logy &&
		playerPos[0] - 2.5 < logx + length &&
		playerPos[0] + 2.5 > logx - length;
}

function sinkTimer(index, time) {
	setTimeout(() => {
		sink(index, true);
		sinkTimer(index, time);
	}, time);
}

function sink(index, sinking) {
	if (sinking) {
		lilyPos[index][4] -= 0.1;
	} else {
		lilyPos[index][4] += 0.1;
	}
	setTimeout(() => {
		var height = lilyPos[index][4];
		if (height < -0.05) {
			sink(index, sinking ? height < -3.0 ? false : true : false);
		}
	}, 100);
}

function drawGround( mv ) {
	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.uniform4fv( colorLoc, GRAY );

	mv = mult( mv, translate( 0.0, 10, -1.5 ) );
	var mv1 = mult( mv, translate( 0.0, 22, -0.5 ) );

    mv = mult( mv, scalem( 100, 16, 0.5 ) );
    mv1 = mult( mv1, scalem( 100, 20, 0.5 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
	gl.uniform4fv( colorLoc, BLUE );
	gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawCar( x, y, color, direction, mv ) {
	var mv1 = mult( mv, translate( x, y, 0.0 ) );
	if (!direction) {
		mv1 = mult( mv1, rotateZ(180) );
	}

	gl.uniform4fv( colorLoc, color );

	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	var mv2 = mv1;
	// lower body of the car

	mv1 = mult( mv1, scalem( 10.0, 3.0, 2.0 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

	// upper part of the car
	mv2 = mult( mv2, scalem( 4.0, 3.0, 2.0 ) );
	mv2 = mult( mv2, translate( -0.2, 0.0, 1.0 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawLog( x, y, length, direction, mv ) {
	var mv1 = mult( mv, translate( x, y, 0.0 ) );
	mv1 = mult( mv1, scalem( length, 1.0, 1.0 ) );
	if (!direction) {
		mv1 = mult( mv1, rotateZ(180) );
	}

	gl.uniform4fv( colorLoc, GRAY );

	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	mv1 = mult( mv1, scalem( 3.0, 3.0, 2.0 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawPlayer( mv ) {
	mv = mult( mv, translate( playerPos[0], playerPos[1], 0.0 ) );
	mv = mult( mv, scalem( 2.75, 2.75, 2.75 ) );

	gl.uniform4fv( colorLoc, BLUE );

	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawLily(x, y, length, height, direction, mv) {
	var mv1 = mult( mv, translate( x, y, height ) );
	mv1 = mult( mv1, scalem( length, 1.0, 1.0 ) );
	if (!direction) {
		mv1 = mult( mv1, rotateZ(180) );
	}

	gl.uniform4fv( colorLoc, RED );

	gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

	mv1 = mult( mv1, scalem( 3.0, 3.0, 1.0 ) );

	gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
	gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawCars( mv ) {
	for (var i = 0; i < numCars; i++) {
		var pos = carPos[i];
		var direction = pos[1] % 8 == 0;
		var speed = laneSpeed[pos[1]%4];
		drawCar( pos[0], pos[1], pos[2], direction, mv );
		pos[0] = ((pos[0] + 150 + (direction ? speed : -speed)) % 100) - 50;
	}
}

function drawLogs( mv ) {
	var mv1 = mult( mv, translate( 0.0, 0.0, -0.5 ) );
	for (var i = 0; i < numLogs; i++) {
		var pos = logPos[i];
		var direction = pos[1] % 8 == 0;
		var speed = streamSpeed[pos[1]%4];
		drawLog( pos[0], pos[1], pos[2], direction, mv1 );
		pos[0] = ((pos[0] + 150 + (direction ? speed : -speed)) % 100) - 50;
	}
}

function drawLilies( mv ) {
	var mv1 = mult( mv, translate( 0.0, 0.0, -0.7 ) );
	for (var i = 0; i < numLilies; i++) {
		var pos = lilyPos[i];
		var direction = pos[1] % 8 == 0;
		var speed = streamSpeed[pos[1]%4];
		drawLily( pos[0], pos[1], pos[2], pos[4], direction, mv1 );
		pos[0] = ((pos[0] + 150 + (direction ? speed : -speed)) % 100) -50;
	}
}

function tick() {
	if (playerPos[1] > 20) {
		for (var i = 0; i < numLogs; i++) {
			if (isFloating(logPos[i])) {
				onLog = true;
				break;
			} else onLog = false;
		}
		if (!onLog) {
			for (var i = 0; i < numLilies; i++) {
				if (lilyPos[i][4] > -0.5 && isFloating(lilyPos[i])) {
					onLog = true;
					break;
				} else {
					onLog = false;
				}
			}
		}
	} else if (playerPos[1] < 20) {
		for (var i = 0; i < numCars; i++) {
			if (collision(playerPos, carPos[i], playerLength, carLength)) {
				dead = true;
			}
		}
	}
	setTimeout(() => {
		tick();
	}, 50);
}

function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if ( playerPos[1] > 20 ) {
		if ( onLog ) {
			playerPos[0] += (playerPos[1]%8 != 0 ? -1 : 1) * streamSpeed[(playerPos[1]-20)%4];
		} else {
			dead = true;
		}
	}

	var mv = mat4();
	switch( view ) {
		case 1:
			// Behind the frog
			mv = lookAt( vec3(20.0, playerPos[1]-50.0, 50.0), vec3(0.0, playerPos[1], 0.0), vec3(0.0, 0.0, 1.0 ) );
			mv = mult( mv, rotateX(spinY) );
			mv = mult( mv, rotateZ(spinZ) );

			drawGround( mv );
			drawLogs( mv );
			drawCars( mv );
			drawLilies( mv );
			drawPlayer( mv );
			break;
		case 2:
			// Frog pov
			mv = mult( mv, rotateX(spinY) );
			mv = mult( mv, rotateZ(spinZ) );
			mv = mult( mv, translate( -playerPos[0], -playerPos[1], -5.0 ) );
			mv = mult( mv, perspective( 70.0, 1.0, 0.1, 10.0 ) );
			//mv = lookAt( vec3(playerPos[0], playerPos[1], 5.0), vec3(0.0, playerPos[1]+5.0, 0.0), vec3(0.0, 100.0, 100.0 ) );


			drawGround( mv );
			drawLogs( mv );
			drawCars( mv );
			drawLilies( mv );
			drawPlayer( mv );
			//drawPlayer( mv );
			break;
	}

	if (!dead) requestAnimFrame( render );
}
