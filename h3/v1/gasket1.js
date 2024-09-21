"use strict";

var gl;
var points;
var colors = [];

var color = vec4();

var NumPoints = 5000;

var panX = 0;
var panY = 0;
var origX;
var origY;
var scroll = 1;

var program;

var movement = false;
var matrixLoc;
var matrixColor;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Initialize our data for the Sierpinski Gasket
    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];

    var u = add( vertices[0], vertices[1] );
    var v = add( vertices[0], vertices[2] );
    var p = scale( 0.25, add( u, v ) );

    points = [ p ];
	colors.push(vec4(1.0, 1.0, 1.0, 1.0));

    for ( var i = 0; points.length < NumPoints; ++i ) {
        var j = Math.floor(Math.random() * 3);
        p = add( points[i], vertices[j] );
        p = scale( 0.5, p );
        points.push( p );
		colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );
    matrixColor = gl.getUniformLocation( program, "color_transform" );

    canvas.addEventListener("mousedown", function(e) {
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });
    canvas.addEventListener("mouseup", function(e) {
        movement = false;
    });
    canvas.addEventListener("mousemove", function(e) {
        if(movement) {
            panX += (e.offsetX - origX) * 1/256 * 1/scroll;
            panY -= (e.offsetY - origY) * 1/256 * 1/scroll;
            origX = e.offsetX;
            origY = e.offsetY;
			console.log(panX);
        }
    });
	canvas.addEventListener("wheel", function(e) {
		scroll += e.deltaY * 0.001;
	});

    render();
};

window.addEventListener("keydown", function(e) {
	if (e.keyCode == 32) {
		color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
	}
});

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    var mv = mat4();
	mv = mult( mv, scalem(scroll, scroll, 1) );
    mv = mult( mv, translate(panX, panY, 0) );

    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));
	gl.uniform4fv(matrixColor, flatten(color));

    gl.drawArrays( gl.POINTS, 0, points.length );

    requestAnimFrame( render );
}

