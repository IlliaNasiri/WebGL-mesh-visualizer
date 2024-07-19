var gl;
var program;
var program2;
var canvas;
var activeKeys = {}

function init() {
    canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL( canvas );
    gl.enable(gl.DEPTH_TEST)
    program = createProgram();
    program2 = createProgram2();
    setUpViewPort();
    setUpEventListeners();
    drawCow2();
    drawCube(vec3(8.0,5.0,5.0))
}

function setUpViewPort() {
    gl.viewport(0,0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function createProgram() {
    var prog = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( prog ); 
    return prog;
}

function createProgram2() {
    var prog = initShaders( gl, "vertex-shader-2", "fragment-shader-2");
    gl.useProgram( prog ); 
    return prog;
}

let totalTranslationX = 0;
let totalTranslationY = 0;
let totalTranslationZ = 0;

let totalRotationX = 0;
let totalRotationY = 0;
let totalRotationZ = 0;

let isPointLightRotating = true;
let totalPointLightRotationY = 0;

let isSpotlightRotating = true;
let spotlightRotation = 0;
let spotlightRotationSign = +1;


function setUpEventListeners() {

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    canvas.addEventListener("contextmenu", (e) => e.preventDefault())
    canvas.addEventListener("mousedown", mouseDownHandler)
    canvas.addEventListener("mouseup", mouseUpHandler)
    canvas.addEventListener("mousemove", mouseMoveHandler)
    canvas.addEventListener("mouseleave", mouseLeaveHandler)
    canvas.addEventListener("wheel", wheelHandler)
}

function handleKeyDown(e) {

    activeKeys[e.code] = true;
    if(e.code == "KeyR") {
        totalRotationX = 0; totalRotationY = 0; totalRotationZ = 0;
        totalTranslationX = 0; totalTranslationY = 0; totalTranslationZ = 0;
    }
    else if(e.code == "ArrowUp") {
        totalTranslationZ += 1;
    } 
    else if(e.code == "ArrowDown") {
        totalTranslationZ -= 1;
    } 
    else if(e.code == "ArrowLeft") {
        totalRotationZ += 5;
    }
    else if(e.code == "ArrowRight") {
        totalRotationZ -= 5;
    }
    else if(e.code == "KeyP") {
        isPointLightRotating = !isPointLightRotating;
    }
    else if(e.code == "KeyS") {
        isSpotlightRotating = !isSpotlightRotating;
    }
}

function handleKeyUp(e) {
    activeKeys[e.code] = false;
}

function mouseUpHandler(e) {
        // left button
        if (e.button == 0) {
            activeKeys["mouseLeft"] = false;
        }
        else if(e.button == 2) {
            activeKeys["mouseRight"] = false;
        }
        else if(e.button == 1) {}  
}

function mouseDownHandler(e) {
        // left button
        if (e.button == 0) {
            activeKeys["mouseLeft"] = true;
        }
        else if(e.button == 2) {
            activeKeys["mouseRight"] = true;
        }
        else if(e.button == 1) {}
   
}

function mouseLeaveHandler(e) {
    activeKeys["mouseLeft"] = false;
    activeKeys["mouseRight"] = false;
}

function mouseMoveHandler(e) {

    if(activeKeys["mouseLeft"] == true) {
        totalTranslationX += e.movementX/(canvas.width / 25);
        totalTranslationY -= e.movementY/(canvas.height / 25);
    }
    else if(activeKeys["mouseRight"] == true) {
        totalRotationY += e.movementX;
        totalRotationX += e.movementY; 
    }
}

function wheelHandler(e) {
    if(e.deltaY < 0) {
        totalTranslationZ += 1;
    } else {
        totalTranslationZ -= 1;
    }
}

function generateIndices() {
    
    let indices = new Uint16Array(flatten(get_faces()))
    for(let i = 0; i < indices.length; i++) {
        indices[i] -= 1;
    }
    return indices;
}


function drawCow2() {
    gl.useProgram(program)
    // console.log(generateVertices().length)
    let points = flatten(generateVertices());

    // let indices = new Uint16Array(flatten(get_faces_fake()));
    // let points = flatten(get_vertices_fake());

    let modelMatrix = mat4();
    let transaltionMatrix = translate(totalTranslationX, totalTranslationY, totalTranslationZ);
    let rotationMatrixXAxis = rotate(totalRotationX, vec3(1,0,0))
    let rotationMatrixYAxis = rotate(totalRotationY, vec3(0,1,0))
    let rotationMatrixZAxis = rotate(totalRotationZ, vec3(0,0,1))
    
    let lookAtMatrix = lookAt(vec3(0,0,30), vec3(0,0,0), vec3(0,1,0))
    let projectionMatrix = perspective(35, 1, 1, 100);
    
    modelMatrix = mult(rotationMatrixYAxis, modelMatrix)
    modelMatrix = mult(rotationMatrixXAxis, modelMatrix)
    modelMatrix = mult(rotationMatrixZAxis, modelMatrix)
    modelMatrix = mult(transaltionMatrix, modelMatrix)


    let modelMatrixUniformLoc = gl.getUniformLocation(program, "model");
    gl.uniformMatrix4fv(modelMatrixUniformLoc, false, flatten(modelMatrix));

    let viewMatrixUniformLoc = gl.getUniformLocation(program, "view");
    gl.uniformMatrix4fv(viewMatrixUniformLoc, false, flatten(lookAtMatrix));

    normalMatrix = transpose(inverse(modelMatrix));
    let normalMatrixUniformLoc = gl.getUniformLocation(program, "normalMatrix");
    gl.uniformMatrix4fv(normalMatrixUniformLoc, false, flatten(normalMatrix));

    let projectionMatrixUniformLoc = gl.getUniformLocation(program, "projection");
    gl.uniformMatrix4fv(projectionMatrixUniformLoc, false, flatten(projectionMatrix));


    let pointLightPositionUniformLoc = gl.getUniformLocation(program, "pointLightPosition");
    gl.uniform4fv(pointLightPositionUniformLoc, [8.0, 5.0, 5.0, 1.0])


    let pointLightRotationYMatrix = rotate(totalPointLightRotationY + 0.0, vec3(0,1,0));
    let pointLightTransformUniformLoc = gl.getUniformLocation(program, "pointLightTransformation");
    gl.uniformMatrix4fv(pointLightTransformUniformLoc, false, flatten(pointLightRotationYMatrix))


    //SPOT LIGHT UNIFORMS!!!!!

    let spotlightPositionUniformLoc = gl.getUniformLocation(program, "spotlightPosition");
    gl.uniform4fv(spotlightPositionUniformLoc, [0.0, 6.0, 6.0, 1.0]);
    
    let spotlightDirectionUniformLoc = gl.getUniformLocation(program, "spotlightDirection");
    gl.uniform4fv(spotlightDirectionUniformLoc, [0.0, -6.0, -6.0, 0.0]);

    let spotlightTransformationUniformLoc = gl.getUniformLocation(program, "spotlightTransformation");
    gl.uniformMatrix4fv(spotlightTransformationUniformLoc, false, flatten(rotate(spotlightRotation, vec4(0.0, 1.0, 0.0, 0.0))));
    
    let spotlightCutoffUniformLoc = gl.getUniformLocation(program, "spotlightCutoff")
    gl.uniform1f(spotlightCutoffUniformLoc, false, 30.0);


    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, points , gl.STATIC_DRAW);
    let positionAttrLoc = gl.getAttribLocation(program, "position");
    gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(positionAttrLoc)

    let normalAttrLoc = gl.getAttribLocation(program, "normal");
    gl.vertexAttribPointer(normalAttrLoc, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalAttrLoc);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, points.length)
    incrementTotalPointLightRotation();


    if(spotlightRotation >= 45) 
        spotlightRotationSign = -1;
    else if(spotlightRotation <= -45)
        spotlightRotationSign = +1;

    if(isSpotlightRotating)
        spotlightRotation += spotlightRotationSign * 1;


    drawCube(vec3(8.0, 5.0, 5.0));
    drawCone(vec3(0.0, 6.0, 6.0), vec3(0.0, -6.0, -6.0), 7.5);
    requestAnimationFrame(drawCow2)

}

function drawCube(pos) {
    gl.useProgram(program2);

    let cubeVertices = [
        vec3(add( pos, vec3(-0.25, -0.25, 0.25) )),
        vec3(add( pos, vec3(0.25, -0.25, 0.25) )),
        vec3(add( pos, vec3(0.25, 0.25, 0.25) )),
        vec3(add( pos, vec3(-0.25, 0.25, 0.25) )),
        vec3(add( pos, vec3(0.25, -0.25, -0.25) )),
        vec3(add( pos, vec3(0.25, 0.25, -0.25) )),
        vec3(add( pos, vec3(-0.25, 0.25, -0.25) )),
        vec3(add( pos, vec3(-0.25, -0.25, -0.25) ))
    ]


    let cubeEdges = flatten([
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [1,4],[2,5],[0,7],[3,6]
    ])

    let data = [];

    for(let i = 0; i < cubeEdges.length; i++) 
        data.push(cubeVertices[cubeEdges[i]]);


    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(data)), gl.STATIC_DRAW);

    let positionAttrLoc = gl.getAttribLocation(program2, "position");
    gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionAttrLoc);
    
    let mvpMatrix = mat4();
    let pointLightRotationYMatrix = rotate(totalPointLightRotationY + 0.0, vec3(0,1,0));
    let lookAtMatrix = lookAt(vec3(0,0,30), vec3(0,0,0), vec3(0,1,0))
    let projectionMatrix = perspective(35, 1, 1, 100);
    mvpMatrix = mult(pointLightRotationYMatrix, mvpMatrix)
    mvpMatrix = mult(lookAtMatrix, mvpMatrix)
    mvpMatrix = mult(projectionMatrix, mvpMatrix)

    let mvpUniformLoc = gl.getUniformLocation(program2, "modelViewProjection");

    gl.uniformMatrix4fv(mvpUniformLoc, false, flatten(mvpMatrix));

    gl.drawArrays(gl.LINES, 0, 24);

}

function drawCone(pos, direction, cutoff) {
    gl.useProgram(program2);

    let vertices = [
        vec3(pos),
        vec3( add(pos, normalize(direction)) )
    ]

    let data = flatten(vertices)


    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    let positionAttrLoc = gl.getAttribLocation(program2, "position");
    gl.vertexAttribPointer(positionAttrLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionAttrLoc);

    let mvpMatrix = mat4();
    let spotlightRotationMatrix = rotate(spotlightRotation, vec3(0.0, 1.0, 0.0));
    let lookAtMatrix = lookAt(vec3(0,0,30), vec3(0,0,0), vec3(0,1,0))
    let projectionMatrix = perspective(35, 1, 1, 100);  
    mvpMatrix = mult(spotlightRotationMatrix, mvpMatrix)
    mvpMatrix = mult(lookAtMatrix, mvpMatrix)
    mvpMatrix = mult(projectionMatrix, mvpMatrix)
    let mvpUniformLoc = gl.getUniformLocation(program2, "modelViewProjection");
    gl.uniformMatrix4fv(mvpUniformLoc, false, flatten(mvpMatrix));
    gl.drawArrays(gl.LINES, 0, 2);
}



function incrementTotalPointLightRotation() {
    if(isPointLightRotating)
        totalPointLightRotationY += 1;
}


function generateVertices() {
    let res = [];
    let points = get_vertices();
    let faces = get_faces();
    let normals = computeAverageVetexNormalArray();
    for(let i = 0; i < faces.length; i++) {
        facePointsIndices = flatten(faces[i])
        faceXindex = facePointsIndices[0] - 1;
        faceYindex = facePointsIndices[1] - 1;
        faceZindex = facePointsIndices[2] - 1;
        res.push(points[faceXindex]);
        res.push(normals[faceXindex]);
        res.push(points[faceYindex]);
        res.push(normals[faceYindex]);
        res.push(points[faceZindex]);
        res.push(normals[faceZindex]);
    }
    return res;
}

function generateNormals(){

    let faceNormals = []
    let faces = get_faces();
    let points = get_vertices();    
    for(let i = 0; i < faces.length; i++) {
        facePointsIndices = flatten(faces[i])
        faceXindex = facePointsIndices[0] - 1;
        faceYindex = facePointsIndices[1] - 1;
        faceZindex = facePointsIndices[2] - 1;
        faceNormals.push(computeNormal(points[faceXindex], points[faceYindex], points[faceZindex]));
    }

    return faceNormals;
}

function computeAverageVetexNormalArray() {
    let faces = get_faces();
    let vertices = get_vertices();

    let normals = [];
    for(let i = 0; i < vertices.length; i++)
        normals.push(vec3(0,0,0));


    for(let face of faces) {
        let faceNormal = computeNormal(vertices[face[0] -1], vertices[face[1]-1], vertices[face[2] - 1]);
        normals[face[0] - 1] = normalize(add(normals[face[0] -1], faceNormal));
        normals[face[1] - 1] = normalize(add(normals[face[1] -1], faceNormal));
        normals[face[2] - 1] = normalize(add(normals[face[2] - 1], faceNormal));
    }  
    // console.log(normals)
    return normals;

}

function computeNormal(p1,p2,p3) {
    v1 = subtract(p2, p1);
    v2 = subtract(p3, p2);
    return vec3(cross(v1, v2))
}

window.onload = init;



