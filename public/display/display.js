'use strict';
angular.module('app', ['ngMaterial', 'lib'])
.config(['socketProvider', function(socketProvider) {
	socketProvider.namespace = 'display';
}])
.run(['socket', function(socket) {
	socket.on('refresh', function() {
		location.reload();
	});

	socket.on('disconnect', function() {
		setTimeout(function() {
			location.reload();
		}, 3000);
	});

	socket.on('rotate', function() {
		var child = container.querySelector('div:first-child');
		container.removeChild(child);
		container.appendChild(child);
	});
}])
.factory('touch', ['socket', 'size', function(socket, size) {
	var tap = null;

	socket.on('touchstart', function(position) {
		tap = position;
	});
	socket.on('touchmove', function(position) {
		tap = position;
	});
	socket.on('touchend', function() {
		tap = null;
	});

	var delta = {x: 0, y: 0};
	socket.on('pan', function(_delta) {
		delta = _delta;
	});

	var scale = 1;
	socket.on('scale', function(_scale) {
		scale = _scale;
	});

	var rotation = 0;
	socket.on('rotateCube', function(_rotation) {
		rotation = _rotation;
	});
	return {
		getTap: function() {
			return tap ? {x: tap.x * size, y: tap.y * size / 2} : null;
		},
		getPanDelta: function() {
			var _delta = delta;
			delta = {x: 0, y: 0};
			return _delta;
		},
		getScale: function() {
			return scale;
		},
		getRotation: function() {
			return rotation;
		}
	};
}])
.factory('size', ['$window', function($window) {
	return Math.min($window.innerWidth, $window.innerHeight);
}])
.directive('fullscreenOnClick', [function() {
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			element.on('click', function() {
				element[0].webkitRequestFullScreen();
			});
		}
	};
}])
.run(['size', function(size) {
	window.initCube(size);
}])
.directive('cube', ['size', function(size) {
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		link: function(scope, element, attr) {
			var canvas = element[0];
			canvas.width = size;
			canvas.height = size / 2;
			var ctx = canvas.getContext('2d');

			requestAnimationFrame(function render(time) {
				ctx.clearRect(0, 0, size, size);

				window.renderCube(ctx, time);

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('clock', [function() {
	return {
		restrict: 'E',
		replace: true,
		template: '<div id="clock"><span class="h" time="{{h}}"></span><span class="m" time="{{m}}"></span><span class="s" time="{{s}}"></span></div>',
		link: function(scope, element, attr) {
			var h = element.find('.h');
			var m = element.find('.m');
			var s = element.find('.s');
			requestAnimationFrame(function render(time) {

				var date = new Date();
				
				scope.$apply(function() {
					scope.h = date.getHours();
					scope.m = date.getMinutes();
					scope.s = date.getSeconds();
				});

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('animationTest', ['size', function(size) {
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		link: function(scope, element, attr) {
			var canvas = element[0];
			canvas.width = size;
			canvas.height = size / 2;
			var ctx = canvas.getContext('2d');

			requestAnimationFrame(function render(time) {
				ctx.clearRect(0, 0, size, size);

				var s = 100 + Math.sin(time/100)*50;
				ctx.save();
				ctx.translate(size / 2, size / 6);
				ctx.rotate(time / 300);
				ctx.fillStyle = '#f0f';
				ctx.fillRect(- s / 2,- s / 2, s, s);
				ctx.restore();

				requestAnimationFrame(render);
			});
		}
	};
}])
.factory('Star', [function() {
	function Star(x, y, z) {
		this.pos = vec3.fromValues(x, y, z);
		this.r = vec3.len(this.pos);

		this.vel = vec3.create();

		function random() {return Math.random()*2 - 1;}

		this.dir = vec3.fromValues(random(), random(), random());
		vec3.normalize(this.dir, this.dir);

		this.calculateVelocity();
		
		// this.vel = vec3.fromValues(0, 0, 0);
		// this.acc = vec3.fromValues(0, 0, 0);
	
		//ac = v^2/r
	}

	Star.prototype = {
		update: function() {

			vec3.add(this.pos, this.pos, this.vel);

			var r = vec3.len(this.pos);
			vec3.scale(this.pos, this.pos, this.r / vec3.len(this.pos));
			
			this.calculateVelocity();	
		},
		calculateVelocity: function() {
			// vec3.cross(this.vel, this.pos, vec3.fromValues(0, 0, 1));
			vec3.cross(this.vel, this.pos, this.dir);
			vec3.normalize(this.vel, this.vel);
			vec3.scale(this.vel, this.vel, 0.01);
			// vec3.scale(this.vel, this.vel, 0.001);
		}
	};

	return Star;
}])
.directive('starField', ['touch', 'size', 'Star', function(touch, size, Star) {
	function deg(angle) {
		return angle * Math.PI / 180;
	}
	var dist = 1;
	function random() { return Math.random() * dist - dist / 2};
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		link: function(scope, element, attr) {
			var canvas = element[0];
			canvas.width = size;
			canvas.height = size / 2;
			var ctx = canvas.getContext('2d');

			ctx.fillStyle = '#fff';

			var stars = [];
			for(var i = 0; i < 100; i++) {
				stars.push(new Star(random(), random(), random()));
				// stars.push(vec3.fromValues(Math.cos(i/100*Math.PI*2), Math.sin(i/100*Math.PI*2), 0));
			}

			var perspectiveMatrix = mat4.create();
			var near = 1, far = 1000;
			var width = size, height = size / 2;
			mat4.perspective(perspectiveMatrix, deg(60), width / height, near, far);

			var globalTransformation = mat4.create();
			mat4.translate(globalTransformation, globalTransformation, vec4.fromValues(0, 0, -1.5, 0));

			// var logs = 0;
			// var fillRect = ctx.fillRect;
			// ctx.fillRect = function(x, y, w, h) {
			// 	if(++logs < 100)
			// 	console.log('fillRect', x, y, w, h);
			// 	fillRect.apply(this, arguments);
			// }
		
			var rotation = {x: 0, y: 0, z: 0};
			requestAnimationFrame(function render(time) {
				// ctx.clearRect(0, 0, size, size);
				ctx.save();
				ctx.translate(size / 2, size / 4);
				(function update() {
					var delta = touch.getPanDelta();
					rotation.x += delta.y;
					rotation.y += delta.x;
					rotation.z = touch.getRotation();

					mat4.identity(globalTransformation);
					mat4.translate(globalTransformation, globalTransformation, vec4.fromValues(0, 0, -1.5, 0));

					mat4.rotateX(globalTransformation, globalTransformation, deg(rotation.x));
					mat4.rotateY(globalTransformation, globalTransformation, deg(rotation.y));
					mat4.rotateZ(globalTransformation, globalTransformation, deg(rotation.z));
					
					var scale = touch.getScale();
					mat4.scale(globalTransformation, globalTransformation, vec3.fromValues(scale, scale, scale));

					stars.forEach(function(star) {
						star.update();
					});
				})();
				[vec3.fromValues(0, 0, 0)].concat(
				stars.map(function(star) {
					return star.pos;
				}))
				.map(function(point) {
					var point4D = vec4.fromValues(point[0], point[1], point[2], 1);
					vec4.transformMat4(point4D, point4D, globalTransformation);
					vec4.transformMat4(point4D, point4D, perspectiveMatrix);
					return point4D;
				})
				// .filter(function(point) {
				// 	return point[2] > near && point[2] < far;
				// })
				.map(function(point4D) {
					// var w = vec4.fromValues(point4D[3], point4D[3], point4D[3], point4D[3]);
					// vec4.divide(point4D, point4D, w);
					var point3D = vec3.fromValues(point4D[0] / point4D[3], point4D[1] / point4D[3], point4D[2] / point4D[3]);
					return point3D;
				})
				.forEach(function(point3D, index) {

					var w = 6, h = 6;
					// var scale = Math.pow(point3D[2], 2) * 1.5;
					var scale = point3D[2] * 1.5;
					// var scale = 1/2;
					w *= scale;
					h *= scale;

					ctx.fillStyle = 'white';
					if(index == 0) {
						w *= 5;
						h *= 5;
						ctx.fillStyle = 'yellow';
					}

					// ctx.fillRect(point3D[0] * width - w / 2, point3D[1] * height - h / 2, w, h);

					ctx.beginPath();
					ctx.arc(point3D[0] * width, point3D[1] * height, Math.abs(w), 0, 2 * Math.PI, false);
					ctx.closePath();
					ctx.fill();
				});

				ctx.restore();

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('touchCube', ['touch', 'size', 'socket', function(touch, size, socket) {
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		link: function(scope, element, attr) {
			var canvas = element[0];
			canvas.width = size;
			canvas.height = size / 2;
			var ctx = canvas.getContext('2d');

			var rotation = {x: 0, y: 0, z: 0};

			requestAnimationFrame(function render(time) {
				ctx.clearRect(0, 0, size, size);

				window.renderCube(ctx, time);

				ctx.fillStyle = '#f00';
				var delta = touch.getPanDelta();
				rotation.x += delta.y;
				rotation.y += delta.x;
				rotation.z = touch.getRotation();
				window.setCubeRotation(rotation.x, rotation.y, -rotation.z);
				var scale = touch.getScale();
				window.setCubeScale(scale);

				requestAnimationFrame(render);
			});
		}
	};
}]);