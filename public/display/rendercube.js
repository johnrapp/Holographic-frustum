'use strict';
window.initCube = function(size) {
	var width = size;
	var height = size;

	var dist = 5;

	var cube = [
		vec3.fromValues(-dist, -dist, -dist),
		vec3.fromValues(-dist, -dist, dist),
		vec3.fromValues(dist, -dist, -dist),
		vec3.fromValues(dist, -dist, dist),
		vec3.fromValues(-dist, dist, -dist),
		vec3.fromValues(dist, dist, -dist),
		vec3.fromValues(dist, dist, dist),
		vec3.fromValues(-dist, dist, dist),
	];

	var perspectiveMatrix = mat4.create();
	var near = 1, far = 1000;
	mat4.perspective(perspectiveMatrix, deg(60), width / height, near, far);

	var globalTransformation = mat4.create();
	mat4.translate(globalTransformation, globalTransformation, vec4.fromValues(0, 0, -100, 0));

	var cubeTransformation = mat4.create();
	var pyramidTransformation = mat4.create();

	function update(time) {
		mat4.rotateX(globalTransformation, globalTransformation, deg(1));
		mat4.rotateY(globalTransformation, globalTransformation, deg(0.5));
	}

	function render() {
		ctx.clearRect(0, 0, width, height);
			push(ctx, function() {
			ctx.translate(width / 2, height / 6);

			ctx.fillStyle = '#fff';
			renderPoints(ctx, cube, cubeTransformation);
		});
	}

	function renderPoints(ctx, points, localTransformation) {
		points.map(function(point) {
			var point4D = vec4.fromValues(point[0], point[1], point[2], 1);
			vec4.transformMat4(point4D, point4D, localTransformation);
			vec4.transformMat4(point4D, point4D, globalTransformation);
			vec4.transformMat4(point4D, point4D, perspectiveMatrix);
			return point4D;
		})
		.filter(function(point) {
			return point[2] > near && point[2] < far;
		})
		.map(function(point4D) {
			// var w = vec4.fromValues(point4D[3], point4D[3], point4D[3], point4D[3]);
			// vec4.divide(point4D, point4D, w);
			var point3D = vec3.fromValues(point4D[0] / point4D[3], point4D[1] / point4D[3], point4D[2] / point4D[3]);
			return point3D;
		})
		.forEach(function(point3D, index) {
			var w = 6, h = 6;
			var scale = Math.pow(point3D[2], -100) * 1/3;
			w *= scale;
			h *= scale;

			ctx.fillRect(point3D[0] * width - w / 2, point3D[1] * height - h / 2, w, h);
		});
	}

	window.rotateCube = function(x, y) {
		mat4.rotateX(globalTransformation, globalTransformation, deg(x));
		mat4.rotateY(globalTransformation, globalTransformation, deg(y));
	}


	window.setCubeRotation = function(x, y) {
		mat4.identity(cubeTransformation);
		mat4.rotateX(cubeTransformation, cubeTransformation, deg(x));
		mat4.rotateY(cubeTransformation, cubeTransformation, deg(y));
	}

	function push(ctx, fn) {
		ctx.save();
		fn();
		ctx.restore();
	}

	function deg(angle) {
		return angle * Math.PI / 180;
	}
	var ctx;
	window.renderCube = function(_ctx, time) {
		ctx = _ctx;
		// update(time);
		render();
	};
}