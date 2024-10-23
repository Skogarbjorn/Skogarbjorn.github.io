var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var normalsArray = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -2.0;

var modelViewLoc;
var projectionLoc;
var projectionMatrix;

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightPosition = vec4(5.0, 5.0, 5.0, 1.0);

//var attenuationConstant, attenuationLinear, attenuationQuadratic;

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	ambientProduct = mult(lightAmbient, materialAmbient);
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);

    normalCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelViewLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrix = perspective( 50.0, 1.0, 0.1, 100.0 );

	gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
	gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );


    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );


    // Event listener for mousewheel
     window.addEventListener("wheel", function(e){
         if( e.deltaY > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
     }  );  
       
    
    render();
}

function normalCube()
{
    quad( 1, 0, 3, 2, 0 );
    quad( 2, 3, 7, 6, 1 );
    quad( 3, 0, 4, 7, 2 );
    quad( 6, 5, 1, 2, 3 );
    quad( 4, 5, 6, 7, 4 );
    quad( 5, 4, 0, 1, 5 );
}

function quad(a, b, c, d, n) 
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var faceNormals = [
        vec4( 0.0, 0.0,  1.0, 0.0 ),  // front
        vec4(  1.0, 0.0, 0.0, 0.0 ),  // right
        vec4( 0.0, -1.0, 0.0, 0.0 ),  // down
        vec4( 0.0,  1.0, 0.0, 0.0 ),  // up
        vec4( 0.0, 0.0, -1.0, 0.0 ),  // back
        vec4( -1.0, 0.0, 0.0, 0.0 )   // left
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        normalsArray.push(faceNormals[n]);
        
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) ) ;

	normalMatrix = [
		vec3(mv[0][0], mv[0][1], mv[0][2]),
        vec3(mv[1][0], mv[1][1], mv[1][2]),
        vec3(mv[2][0], mv[2][1], mv[2][2])
	];
	normalMatrix.matrix = true;

    // Sm��a hilluna
    // Fyrst hli�arnar..
    mv1 = mult( mv, translate( -0.4, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.02, 1.0, 0.3 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    mv1 = mult( mv, translate( 0.4, 0.0, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.02, 1.0, 0.3 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // svo toppurinn..
    mv1 = mult( mv, translate( 0.0, 0.485, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.02, 0.295 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // 3 hillur..
    mv1 = mult( mv, translate( 0.0, 0.2, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.02, 0.295 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    mv1 = mult( mv, translate( 0.0, -0.1, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.02, 0.295 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    mv1 = mult( mv, translate( 0.0, -0.4, 0.0 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.02, 0.295 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // baki�..
    mv1 = mult( mv, translate( 0.0, 0.04, 0.145 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.9, 0.01 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // s�kkullinn..
    mv1 = mult( mv, translate( 0.0, -0.45, -0.11 ) );
    mv1 = mult( mv1, scalem( 0.8, 0.1, 0.02 ) );
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv1));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );


    requestAnimFrame( render );
}

