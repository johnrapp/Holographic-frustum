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
			return tap ? {x: tap.x, y: tap.y} : null;
			// return tap ? {x: tap.x * size, y: tap.y * size / 2} : null;
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

			// vec3.add(this.pos, this.pos, this.vel);

			// var r = vec3.len(this.pos);
			// vec3.scale(this.pos, this.pos, this.r / vec3.len(this.pos));
			
			// this.calculateVelocity();
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
				ctx.clearRect(0, 0, size, size);
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
				rotation.x += -delta.y;
				rotation.y += -delta.x;
				rotation.z = touch.getRotation();
				window.setCubeRotation(rotation.x, rotation.y, -rotation.z);
				var scale = touch.getScale();
				window.setCubeScale(scale);

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('testGameNew', ['touch', 'size', 'socket', function(touch, size, socket) {
	return {
		restrict: 'E',
		replace: true,
		template: '<canvas></canvas>',
		link: function(scope, element, attr) {
			var canvas = element[0];
			var w = size;
			var h = size / 2;
			canvas.width = w;
			canvas.height = h;
			var ctx = canvas.getContext('2d');

			function point(x, y, z) {
				return vec4.fromValues(x, y, z, 1);
			}

			// var n = 0;
			var n = 1;
			var f = 1000;


			// var p = point(10, 0, 0);

			var ps = [
				point(-1, -1/2, -1.5),
				point(1, -1/2, -1.5),
				point(1, 1/2, -1.5),
				point(-1, 1/2, -1.5),

				point(-1, -1/2, -0.5),
				point(1, -1/2, -0.5),
				point(1, 1/2, -0.5),
				point(-1, 1/2, -0.5),

				point(-1, -1/2, 0.5),
				point(1, -1/2, 0.5),
				point(1, 1/2, 0.5),
				point(-1, 1/2, 0.5),

				point(-1, -1/2, 1.5),
				point(1, -1/2, 1.5),
				point(1, 1/2, 1.5),
				point(-1, 1/2, 1.5),
			];

			// var camera = mat4.create();
			// mat4.frustum(camera, -w/2, w/2, -h/2, h/2, n, f);
			// mat4.frustum(camera, -w/2, w/2, -h/2, h/2, 1, w/2);
			// var view = mat4.create();
			// mat4.scale(camera, camera, vec4.fromValues(w*w / 4, h*h / 4, 1, 1));

			// mat4.translate(camera, camera, vec4.fromValues(0, 0, 1, 0));

			// mat4.translate(camera, camera, vec4.fromValues(0, 0, 1.5, 0));

			// var paddlePos = {x: 0.2, y: 0.3};

			// var ball.vel = point(0, 0, 1.5);

			var fx = 0;
			var fy = 0;
			// var fx = 0, fy = 0;

			var pw = 0.2;
			var ph = pw * 2/3;

			element.on('mousemove', function(e) {
				fx = e.layerX * 2/345 - 1;
				fy = e.layerY / 173;
			});

			function Ball() {

			}
			Ball.prototype = {
				pos: point(-0.3, -0.1, 1),
				vel: point(0, 0, 2),
				acc: point(0, 0, 0),
				// vel: point(0.2, -0.1, 2),
				r: 0.1,
				update: function(time, dt) {
					vec4.add(this.vel, this.vel, vec4.fromValues(this.acc[0] * dt, this.acc[1] * dt, this.acc[2] * dt, 0));

					vec4.add(this.pos, this.pos, vec4.fromValues(this.vel[0] * dt, this.vel[1] * dt, this.vel[2] * dt, 0));

					// this.acc = point(Math.pow(Math.E, 0.9 * dt));

					vec3.scale(this.acc, this.acc, 0.999);

					if(this.pos[2] >= 3) {
						this.pos = point(this.pos[0], this.pos[1], 3);

						this.vel = point(this.vel[0], this.vel[1], -this.vel[2]);
						// this.vel = point(-this.vel[0] + paddleVel[0] * 6, -this.vel[1] + -paddleVel[1] * 6, -this.vel[2]);
						// this.vel = point(paddleVel[0] * 6, -paddleVel[1] * 6, -this.vel[2]);
						// this.vel = point(paddleVel[0], paddleVel[1], -this.vel[2]);
					}
					if(this.pos[2] <= 0) {
						this.pos = point(this.pos[0], this.pos[1], 0);
						// this.vel = point(0, 0, -this.vel[2]);
						// this.vel = point(this.vel[0] + paddle.vel[0] * 6, this.vel[1] + -paddle.vel[1] * 6, -this.vel[2]);
						// this.vel = point(this.vel[0], this.vel[1], -this.vel[2]);
						// vec4.normalize(this.vel, this.vel);
						
						if(this.pos[0] + this.r >= paddle.pos[0] - paddle.w
						&& this.pos[0] - this.r <= paddle.pos[0] + paddle.w
						&& -this.pos[1] + this.r >= paddle.pos[1] - paddle.h
						&& -this.pos[1] - this.r <= paddle.pos[1] + paddle.h) {

							this.vel = point(this.vel[0], this.vel[1], -this.vel[2]);
							// this.vel = point(this.vel[0] + paddle.vel[0] * 6, this.vel[1] + -paddle.vel[1] * 6, -this.vel[2]);

							this.acc = point(paddle.vel[0] * 12, -paddle.vel[1] * 12, 0);

							this.hitTime = time;
						} else {
							this.vel = point(this.vel[0], this.vel[1], -this.vel[2]);
						}

					}
					if(this.pos[1] >= 0.5) {
						this.pos = point(this.pos[0], 0.5, this.pos[2]);
						this.vel = point(this.vel[0], -this.vel[1], this.vel[2]);
					}
					if(this.pos[1] <= -0.5) {
						this.pos = point(this.pos[0], -0.5, this.pos[2]);
						this.vel = point(this.vel[0], -this.vel[1], this.vel[2]);
					}

					if(this.pos[0] >= 1) {
						this.pos = point(1, this.pos[1], this.pos[2]);
						this.vel = point(-this.vel[0], this.vel[1], this.vel[2]);
					}
					if(this.pos[0] <= -1) {
						this.pos = point(-1, this.pos[1], this.pos[2]);
						this.vel = point(-this.vel[0], this.vel[1], this.vel[2]);
					}

					if(time - this.hitTime < 1000) {
						this.color = '#00f';
					} else {
						this.color = '#f00';
					}
				},
				render: function(ctx, world, camera) {
					ctx.fillStyle = this.color;
					// ctx.fillStyle = '#f00';

					[
						[
							point(this.pos[0], this.pos[1], this.pos[2] + this.r),
							point(this.pos[0] + this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] + this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] + this.r),
							point(this.pos[0] - this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] + this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] + this.r),
							point(this.pos[0] + this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] - this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] + this.r),
							point(this.pos[0] - this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] - this.r, this.pos[2]),
						],

						[
							point(this.pos[0], this.pos[1], this.pos[2] - this.r),
							point(this.pos[0] + this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] + this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] - this.r),
							point(this.pos[0] - this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] + this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] - this.r),
							point(this.pos[0] + this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] - this.r, this.pos[2]),
						],
						[
							point(this.pos[0], this.pos[1], this.pos[2] - this.r),
							point(this.pos[0] - this.r, this.pos[1], this.pos[2]),
							point(this.pos[0], this.pos[1] - this.r, this.pos[2]),
						],
					]
					.forEach(function(face) {
						ctx.beginPath();
						face.forEach(function(p, i) {
							var pp = vec4.create();
							vec3.transformMat4(pp, p, world);
							vec3.transformMat4(pp, pp, camera);
							if(i == 0) {
								ctx.moveTo(pp[0], pp[1]);
							} else {
								ctx.lineTo(pp[0], pp[1]);
							}
						});
						ctx.closePath();
						ctx.fill();
					});

					ctx.beginPath();
					for(var v = 0; v <= Math.PI * 2; v += Math.PI * 2 / 16) {
						var b = point(Math.cos(v) * this.r + this.pos[0], Math.sin(v) * this.r + this.pos[1], this.pos[2]);
						var bp = vec4.create();
						vec3.transformMat4(bp, b, world);
						vec3.transformMat4(bp, bp, camera);
						// if(first) console.log(v)
						if(v == 0) {
							ctx.moveTo(bp[0], bp[1]);
						} else {
							ctx.lineTo(bp[0], bp[1]);
						}
					}
					ctx.closePath();
					ctx.fill();

					ctx.beginPath();
					for(var v = 0; v <= Math.PI * 2; v += Math.PI * 2 / 16) {
						var b = point(this.pos[0], Math.sin(v) * this.r + this.pos[1], Math.cos(v) * this.r + this.pos[2]);
						var bp = vec4.create();
						vec3.transformMat4(bp, b, world);
						vec3.transformMat4(bp, bp, camera);
						// if(first) console.log(v)
						if(v == 0) {
							ctx.moveTo(bp[0], bp[1]);
						} else {
							ctx.lineTo(bp[0], bp[1]);
						}
					}
					ctx.closePath();
					ctx.fill();
				}
			};

			function Paddle(z, color) {
				this.pos = point(1, 0.5, z);
				this.color = color;
			}
			Paddle.prototype = {
				pos: null,
				lastPos: null,
				vel: null,
				w: 0.2,
				h: 0.2 * 2/3,
				update: function(time, dt) {
					var tap = touch.getTap();

					this.lastPos = this.pos;
					if(tap != null) {
						fx = tap.x * 2;
						fy = tap.y * 2;
					}

					this.pos = point(fx - 1, fy - 0.5, 0);

					this.keepWithinBounds();

					this.vel = vec4.create();
					vec4.subtract(this.vel, this.pos, this.lastPos);
				},
				render: function(ctx, world, camera) {
					ctx.beginPath();
					[
						point(-this.w + this.pos[0], -this.h - this.pos[1], this.pos[2]),
						point(this.w + this.pos[0], -this.h - this.pos[1], this.pos[2]),
						point(this.w + this.pos[0], this.h - this.pos[1], this.pos[2]),
						point(-this.w + this.pos[0], this.h - this.pos[1], this.pos[2]),
					]
					.forEach(function(p, i) {
						var pp = vec4.create();
						vec3.transformMat4(pp, p, world);
						vec3.transformMat4(pp, pp, camera);
						if(i == 0) {
							ctx.moveTo(pp[0], pp[1]);
						} else {
							ctx.lineTo(pp[0], pp[1]);
						}
					});

					ctx.closePath();
					ctx.fillStyle = this.color;
					ctx.fill();
				},
				keepWithinBounds: function() {
					if(this.pos[0] <= -(1 - this.w)) {
						this.pos = point(-(1 - this.w), this.pos[1], this.pos[2]);
					}
					if(this.pos[0] >= 1 - this.w) {
						this.pos = point(1 - this.w, this.pos[1], this.pos[2]);
					}

					if(this.pos[1] <= -(0.5 - this.h)) {
						this.pos = point(this.pos[0], -(0.5 - this.h), this.pos[2]);
					}

					if(this.pos[1] >= 0.5 - this.h) {
						this.pos = point(this.pos[0], 0.5 - this.h, this.pos[2]);
					}
				}
			}

			var paddle = new Paddle(0, 'rgba(200, 200, 200, 0.5)');
			var backPaddle = new Paddle(3, 'rgba(200, 200, 200, 0.8)');
			backPaddle.update = function(time, dt) {
				// this.pos = point(paddle.pos[0], paddle.pos[1], this.pos[2]);
				this.pos = point(ball.pos[0], -ball.pos[1], this.pos[2]);
				this.keepWithinBounds();
			};

			var ball = new Ball();

			window.paddle = paddle; window.backPaddle = backPaddle; window.ball = ball;

			function update(time, dt) {

				paddle.update(time, dt);

				ball.update(time, dt);

				backPaddle.update(time, dt);
			}
			var first = true;

			// var lastTime = null;
			var lastTime = 0;
			requestAnimationFrame(function tick(time) {

				var dt = (time - lastTime) / 1000;

				update(time, dt);

				ctx.clearRect(0, 0, w, h);
				// ctx.clearRect(-w/2, -h/2, w, h);

				ctx.save();

				ctx.translate(0, h);
				ctx.scale(1, -1);
				ctx.translate(w/2, h/2);
				ctx.translate(0, h/4);

				var camera = mat4.create();
				mat4.frustum(camera, -w/2, w/2, -h/4, h/4, n, f);
				mat4.scale(camera, camera, vec4.fromValues((w / 2)*(w / 4), (h / 2)*(h / 4), -1, 1));
				mat4.translate(camera, camera, vec4.fromValues(0, 0, n, 0));

				// var i = (Math.asin(Math.sin(time / 800)) + Math.PI/2) / Math.PI;
				// i = i*i*i*i*(35 + i*(-84 + i*(70 - i*20)));

				var i = 0;
				// var i = 1;

				var ii = (Math.asin(Math.sin(time / 800 * 2)) + Math.PI/2) / Math.PI;
				ii = ii*ii*ii*ii*(35 + ii*(-84 + ii*(70 - ii*20)));

				var iii = (Math.asin(Math.sin(time / 800 * 2)) + Math.PI/2) / Math.PI;
				// iii = iii*iii*iii*iii*(35 + iii*(-84 + iii*(70 - iii*20)));

				mat4.translate(camera, camera, vec4.fromValues(0, 0, i*1.5, 0));

				// mat4.translate(camera, camera, vec4.fromValues(0, 0, 1.5, 0));

				var tunnelMatrix = mat4.create();
				mat4.translate(tunnelMatrix, tunnelMatrix, vec4.fromValues(0, 0, 1.5, 0));
				// mat4.rotateY(tunnelMatrix, tunnelMatrix, a);
				// mat4.scale(tunnelMatrix, tunnelMatrix, vec4.fromValues(1, 1, 1, 1));

				var world = mat4.create();
				// mat4.scale(world, world, vec4.fromValues(1, 1, 1/2, 1));

				mat4.rotateY(world, world, i * Math.PI / 2);
				mat4.translate(world, world, vec4.fromValues(0, 0, -1.5 * i, 0));

				// mat4.rotateY(world, world, Math.PI / 2);
				// mat4.translate(world, world, vec4.fromValues(0, 0, -1.5, 0));

				// ball.pos = point(ball.pos[0], ball.pos[1], iii * 3);
				// ball.pos = point(ball.pos[0], ball.pos[1], iii * 3);

				function transform(p) {
					var pp = vec4.create();
					vec3.transformMat4(pp, p, tunnelMatrix);
					vec3.transformMat4(pp, pp, world);
					vec3.transformMat4(pp, pp, camera);
					return pp;
				}

				var s1 = ps.slice(0, 4);
				var s2 = ps.slice(4, 8);
				var s3 = ps.slice(8, 12);
				var s4 = ps.slice(12, 16);

				var slices = [s1, s2, s3, s4];

				ctx.strokeStyle = '#0f0';
				ctx.lineWidth = 5;

				slices.forEach(function(slice, i, slices) {
					ctx.beginPath();
					slice.forEach(function(p, j) {
						var pp = transform(p);
						// ctx.lineWidth = 5 * ((pp[2] - 1.5) / 1.5 + 0.5)/1.5;
						if(j == 0) {
							ctx.moveTo(pp[0], pp[1]);
						} else {
							ctx.lineTo(pp[0], pp[1]);
						}
					});
					ctx.closePath();
					ctx.stroke();

					if(i != 0) {
						ctx.beginPath();
						slice.forEach(function(p, j) {
							var pp = transform(p);
							ctx.moveTo(pp[0], pp[1]);
							var P = slices[i - 1][j];
							var PP = transform(P);
							ctx.lineTo(PP[0], PP[1]);
						});

						ctx.closePath();
						ctx.stroke();
					}
				});

				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 2;
				
				ctx.beginPath();
				[
					point(-1, -1/2, ball.pos[2]),
					point(1, -1/2, ball.pos[2]),
					point(1, 1/2, ball.pos[2]),
					point(-1, 1/2, ball.pos[2]),
				]
				.forEach(function(p, j) {
					var pp = vec4.create();
					vec3.transformMat4(pp, p, world);
					vec3.transformMat4(pp, pp, camera);
					// ctx.lineWidth = 5 * ((pp[2] - 1.5) / 1.5 + 0.5)/1.5;
					if(j == 0) {
						ctx.moveTo(pp[0], pp[1]);
					} else {
						ctx.lineTo(pp[0], pp[1]);
					}
				});
				ctx.closePath();
				ctx.stroke();

				backPaddle.render(ctx, world, camera);

				ball.render(ctx, world, camera);

				paddle.render(ctx, world, camera);

				ctx.restore();

				lastTime = time;

				first = false;

				requestAnimationFrame(tick);
			});
		}
	};
}]);