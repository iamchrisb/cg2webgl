/*
 * WebGL / Javascript tutorial.
 * Author: Hartmut Schirmacher, hschirmacher.beuth-hochschule.de
 * (C)opyright 2011-2012 by Hartmut Schirmacher, all rights reserved. 
 *
 */




/*

   Object: GenerateParametricSurface  
   
   This is basically a function generating vertex attribute buffers 
   and a draw() method for the specified parametric surface object
    
   Parameters to the constructor:
   - gl: WebGL context
   - obj: object that defines position(), normal(), and texCoord() 
     methods. These methods take (u,v) as input and output the 
     desired attribute (3 floats or 2 floats).
   - M, N: generate MxN surface patches (times 2 triangles)
   - umin, umax: parameter domain for the u coordinate
   - vmin, vmax: parameter domain for the v coordinate
   - col1, col2: colors to be used for colorizing the patches 
     in a checkerboard fashion
     
   Result:
   - obj will be assigned a new method draw(program)
   - obj.numVertices will contain the number of vertices in the buffers
   - obj.posBuffer, obj.normalBuffer, obj.texCoordBuffer, obj.colorBuffer
     will reference the respective buffers
   */ 

GenerateParametricSurface = function(gl, obj, M, N, umin, umax, vmin, vmax, col1, col2) {

    // remmeber the object to be used for calculating vertex attributes
    this.obj = obj;
    
    // instantiate the shape as a member variable of obj
    var numVertices = M*N*6;

    // arrays for the vertex positions and colors
    var vposition = new Float32Array(numVertices*3);
    var vnormal   = new Float32Array(numVertices*3);
    var vcolor    = new Float32Array(numVertices*3);
    var vtexcoord = new Float32Array(numVertices*2);
    
    // current index within the three arrays
    var pos_i = 0;
    var col_i = 0;
    var nor_i = 0;
    var tex_i = 0;
    
    // subroutine to set all values for a single vertex
    this.makeVertex = function(uu,vv,color) {

        // calculate and set texture coordinates
        if(this.obj.texCoord != undefined) {
            var tex = this.obj.texCoord(uu,vv);
            vtexcoord[tex_i++] = tex[0];
            vtexcoord[tex_i++] = tex[1];
        }

        // calculate and set vertex position
        if(this.obj.position != undefined) {
            var pos = this.obj.position(uu,vv);
            vposition[pos_i++] = pos[0];
            vposition[pos_i++] = pos[1];
            vposition[pos_i++] = pos[2];
        }

        // calculate and set vertex normal
        if(this.obj.normal != undefined) {
            var norm = this.obj.normal(uu,vv);
            vnormal[nor_i++] = norm[0];
            vnormal[nor_i++] = norm[1];
            vnormal[nor_i++] = norm[2];
        }
        
        // set vertex color
        if(color != undefined) {
            vcolor[col_i++] = color[0];
            vcolor[col_i++] = color[1];
            vcolor[col_i++] = color[2];
        }
    }
    
    // loop over the two surface parameters u and v
    for(var i=1; i<=M; i++) {
        for(var j=1; j<=N; j++) {

            // previous position (u0,v0) on the surface 
            var u0 = umin + (i-1.0) * (umax-umin) / M;
            var v0 = vmin + (j-1.0) * (vmax-vmin) / N;
            
            // current position (u,v) on the surface 
            var u = umin + i * (umax-umin) / M;
            var v = vmin + j * (vmax-vmin) / N;
                        
            // colors shall alternate between col1 and col2
            var color = ((i+j)%2 == 0)? col1 : col2;

            // 1st triangle
            this.makeVertex(u0,v , color);
            this.makeVertex(u0,v0, color);
            this.makeVertex(u ,v0, color);

            // 2nd triangle
            this.makeVertex(u ,v , color);
            this.makeVertex(u0,v , color);
            this.makeVertex(u ,v0, color);
            
        }
    }
    // create vertex buffer objects (VBOs) 
    obj.numVertices = numVertices;
    if(obj.position != undefined) 
        obj.posBuffer = new VertexAttributeBuffer(gl, "vertexPosition", gl.FLOAT, 3, vposition);
        
    if(obj.normal != undefined) 
        obj.normalBuffer = new VertexAttributeBuffer(gl, "vertexNormal",   gl.FLOAT, 3, vnormal); 
        
    if(obj.texCoord != undefined) 
        obj.texCoordBuffer = new VertexAttributeBuffer(gl, "vertexTexCoord", gl.FLOAT, 2, vtexcoord);

    if(col1 != undefined && col2 != undefined) 
        obj.colorBuffer = new VertexAttributeBuffer(gl, "vertexColor",    gl.FLOAT, 3, vcolor);
        

    // add a draw method to the object
    obj.draw = function(program) {
        
        // go through all vertex attribute buffers 
        // and enable them before drawing
        if(this.posBuffer != null) 
            this.posBuffer.makeActive(program);
        if(this.normalBuffer != null)
            this.normalBuffer.makeActive(program);
        if(this.texCoordBuffer != null)
            this.texCoordBuffer.makeActive(program);
        if(this.colorBuffer != null)
            this.colorBuffer.makeActive(program);
            
        if(this.elementBuffer != null) {
            // draw using element buffer
            this.elementBuffer.makeActive(program, true);
            program.gl.drawArrays(program.gl.TRIANGLES, 0, this.elementBuffer.numElements);
        } else {
            // draw using attribute buffers only
            program.gl.drawArrays(program.gl.TRIANGLES, 0, this.numVertices);
        }
        
    }
        
}

    
/*

   Object: Torus
   
   Defines position, normal, and some texture coordinates for a torus.
   Uses GenerateParaetricSurface to create the respective 
   vertex attributes. 

*/
    
    
Torus = function(gl, radius, radius2, N, M, col1, col2) {

    // remember radii so we can use them in position() and normal()
    this.radius = radius;
    this.radius2 = radius2;
    
    // define x/y/z coordinates for this torus
    this.position = function(t,p) {
        return [ (this.radius + this.radius2 * Math.cos(p)) * Math.cos(t),
                    (this.radius + this.radius2 * Math.cos(p)) * Math.sin(t),
                    this.radius2 * Math.sin(p) ];
    }
        
    // define normal directions for this torus
    this.normal = function(t,p) {
        h = 1.0; // this.radius2 * (this.radius2 * Math.cos(p) + this.radius);
        return [  Math.cos(t) * Math.cos(p) * h,
                  Math.sin(t) * Math.cos(p) * h,
                  Math.sin(p) * h];
    }

    // define texture coordinates for this torus
    this.texCoord = function(u,v) {
        return [ v  ,
                 u * (2.0 * Math.PI) ];
    }
    
    // call function to generate vertex attributes 
    new GenerateParametricSurface(gl, this, M, N, 0, 2*Math.PI, 0, 2*Math.PI, col1, col2);                              
   
}        

Sphere = function(gl, radius, N, M, col1, col2) {

console.log("we are in da sphere now");
    // remember radii so we can use them in position() and normal()
    this.radius = radius;
    
    this.position = function(t,p) {
    	// t = u
    	// p = v
        return [ 	this.radius * Math.sin(p) * Math.cos(t) ,
                    this.radius * Math.sin(p) * Math.sin(t) ,
                    this.radius * Math.cos(p) ];
    }
        
    // define normal directions for this torus
    this.normal = function(t,p) {
        h = 1.0; // this.radius2 * (this.radius2 * Math.cos(p) + this.radius);
        return [  Math.sin(p) * Math.cos(t) * h,
                  Math.sin(p) * Math.sin(t) * h,
                  Math.cos(p) * h];
    }

    // define texture coordinates for this torus
    this.texCoord = function(u,v) {
		return [ u / (2*Math.PI) + 0.25 ,
				 -v / Math.PI
                 ];
    }
    
    // call function to generate vertex attributes 
    new GenerateParametricSurface(gl, this, M, N, 0, 2*Math.PI, 0, Math.PI, col1, col2);                              
   
}    
   
    
