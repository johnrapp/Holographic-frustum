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
.directive('testGame5', ['touch', 'size', 'socket', function(touch, size, socket) {
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

			window.fx = 0;
			window.fy = 0;
			// var fx = 0, fy = 0;

			element.on('mousemove', function(e) {
				fx = e.layerX * 2/345 - 1;
				fy = e.layerY / 173;
			});

			function update(time) {
				var tap = touch.getTap();
				if(tap) {
					paddlePos.x = tap.x;
					paddlePos.y = tap.y;
				}
			}

			requestAnimationFrame(function render(time) {
				update(time);

				ctx.save();
				ctx.clearRect(0, 0, w, h);

				ctx.translate(w / 4, 0);
				ctx.scale(1/2, 1/2);

				ctx.strokeStyle = '#f00';
				// ctx.strokeStyle = '#f00';
				ctx.lineWidth = 10;

				var magic = 1;

				var X = 2, Y = 1, Z = 3;


				function point(x, y, z) {
					return new Point(x, y, z);
				}
				function Point(x, y, z) {
					this.x = x;
					this.y = y;
					this.z = z;
				}
				Point.prototype = {
					transform: function() {
						var k = 0.5/4;
						var s = 1 - 2*k;
						var tx = k*w*(Math.pow(s, this.z) - 1)/(s-1);
						var ty = k*h*(Math.pow(s, this.z) - 1)/(s-1);
						var scale = Math.pow(s, this.z);
					
						var scaleX = scale * w / X;
						var scaleY = scale * h;
						var scaleZ = scale;

						var p = new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
						p.scale = scale;
						return p;
						// return new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
					}
				};

				[
					[ point(0, 0, 0), point(0, 0, 3) ],
					[ point(0, 1, 0), point(0, 1, 3) ],

					[ point(2, 0, 0), point(2, 0, 3) ],
					[ point(2, 1, 0), point(2, 1, 3) ],

					[ point(0, 0, 0), point(0, 1, 0) ],
					[ point(2, 0, 0), point(2, 1, 0) ],

					[ point(0, 0, 3), point(0, 1, 3) ],
					[ point(2, 0, 3), point(2, 1, 3) ],

					[ point(0, 0, 0), point(2, 0, 0) ],
					[ point(0, 0, 3), point(2, 0, 3) ],
					[ point(0, 1, 3), point(2, 1, 3) ],
					[ point(0, 1, 0), point(2, 1, 0) ],

					[ point(0, 0, 1), point(2, 0, 1) ],
					[ point(0, 1, 1), point(2, 1, 1) ],
					[ point(0, 0, 1), point(0, 1, 1) ],
					[ point(2, 0, 1), point(2, 1, 1) ],

					[ point(0, 0, 2), point(2, 0, 2) ],
					[ point(0, 1, 2), point(2, 1, 2) ],
					[ point(0, 0, 2), point(0, 1, 2) ],
					[ point(2, 0, 2), point(2, 1, 2) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#0f0';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);

					ctx.closePath();
					ctx.stroke();
				});

				// var z = 3;
				window.z = (Math.asin(Math.sin(time / 400)) + Math.PI/2) / Math.PI * 3;
				[
					[ point(0, 0, z), point(2, 0, z) ],
					[ point(0, 1, z), point(2, 1, z) ],
					[ point(0, 0, z), point(0, 1, z) ],
					[ point(2, 0, z), point(2, 1, z) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#fff';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);
					
					ctx.closePath();
					ctx.stroke();
				});

				window.x = 1;
				// window.x = Math.cos(time / 200) + 1;
				window.y = 0.5;
				// window.y = Math.sin(time / 200)*0.5 + 0.5;

				var pw = 1/5;
				var ph = pw * 2/3;

				// var fx = 0.75;
				// var fy = 0.35;


				[
					[
						point(fx - pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy + ph/2, 3),
						point(fx - pw/2, fy + ph/2, 3),
					]

				].forEach(function(points, i) {

					ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
					
					ctx.beginPath();
					points.forEach(function(p1, i) {
						var pp1 = p1.transform();
						if(i == 0) {
							ctx.moveTo(pp1.x, pp1.y);
						} else {
							ctx.lineTo(pp1.x, pp1.y);
						}
					});
					ctx.closePath();
					ctx.fill();

				});

				[
					point(x, y, z),
				].forEach(function(p1) {
					var pp1 = p1.transform();

					// ctx.fillStyle = '#00f';
					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);

					ctx.fillStyle = '#f00';
					ctx.beginPath();
					ctx.arc(pp1.x, pp1.y, h/21 * pp1.scale, 0, 2 * Math.PI);
					ctx.closePath();
					ctx.fill();
				});


				[
					[
						point(fx - pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy + ph/2, 0),
						point(fx - pw/2, fy + ph/2, 0),
					]

				].forEach(function(points, i) {

					ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
					
					ctx.beginPath();
					points.forEach(function(p1, i) {
						var pp1 = p1.transform();
						if(i == 0) {
							ctx.moveTo(pp1.x, pp1.y);
						} else {
							ctx.lineTo(pp1.x, pp1.y);
						}
					});
					ctx.closePath();
					ctx.fill();

				});

				// [
				// 	// [ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 - 1/3) ],
				// 	[ point(1.25, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// ].forEach(function(line) {
				// 	var p1 = line[0];
				// 	var p2 = line[1];

				// 	var pp1 = p1.transform();
				// 	var pp2 = p2.transform();

				// 	ctx.strokeStyle = '#0f0';
				// 	ctx.beginPath();

				// 	// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
				// 	ctx.moveTo(pp1.x, pp1.y);
				// 	ctx.lineTo(pp2.x, pp2.y);

				// 	ctx.closePath();
				// 	ctx.stroke();
				// });
			
				ctx.restore();

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('testGame6', ['touch', 'size', 'socket', function(touch, size, socket) {
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

			var rotation = {x: 0, y: 0, z: 0};

			var paddlePos = {x: w / 4, y: h*7/9};
			// var ballPos = {x: 0, y: 0, z: 0};
		
			function update(time) {
				var tap = touch.getTap();
				if(tap) {
					paddlePos.x = tap.x;
					paddlePos.y = tap.y;
				}
			}

			requestAnimationFrame(function render(time) {
				update(time);

				ctx.save();
				ctx.clearRect(0, 0, w, h);

				ctx.translate(w / 4, 0);
				ctx.scale(1/2, 1/2);

				// ctx.strokeStyle = '#f00';
				ctx.lineWidth = 10;

				var magic = 1;

				var X = 2, Y = 1, Z = 3;


				function point(x, y, z) {
					return new Point(x, y, z);
				}
				function Point(x, y, z) {
					this.x = x;
					this.y = y;
					this.z = z;
				}
				Point.prototype = {
					transform: function() {
						var k = 0.24 * this.x / X;
						var s = 1 - 2*k;

						var tx = this.x == 0 ? 0 : k*w*(Math.pow(s, magic) - 1)/(s-1);
						var ty = this.x == 0 ? 0 : k*h*(Math.pow(s, magic) - 1)/(s-1);
					
						var scale = Math.pow(s, magic);
						var scaleX = scale;
						var scaleY = scale * h;
						var scaleZ = scale * w / Z;

						var p = new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
						p.scale = scale;
						return p;
						// return new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
					}
				};

				[
					[ point(0, 0, 0), point(0, 0, 3) ],
					[ point(0, 1, 0), point(0, 1, 3) ],

					[ point(2, 0, 0), point(2, 0, 3) ],
					[ point(2, 1, 0), point(2, 1, 3) ],

					[ point(0, 0, 0), point(0, 1, 0) ],
					[ point(2, 0, 0), point(2, 1, 0) ],

					[ point(0, 0, 3), point(0, 1, 3) ],
					[ point(2, 0, 3), point(2, 1, 3) ],

					[ point(0, 0, 0), point(2, 0, 0) ],
					[ point(0, 0, 3), point(2, 0, 3) ],
					[ point(0, 1, 3), point(2, 1, 3) ],
					[ point(0, 1, 0), point(2, 1, 0) ],

					[ point(0, 0, 1), point(2, 0, 1) ],
					[ point(0, 1, 1), point(2, 1, 1) ],
					[ point(0, 0, 1), point(0, 1, 1) ],
					[ point(2, 0, 1), point(2, 1, 1) ],

					[ point(0, 0, 2), point(2, 0, 2) ],
					[ point(0, 1, 2), point(2, 1, 2) ],
					[ point(0, 0, 2), point(0, 1, 2) ],
					[ point(2, 0, 2), point(2, 1, 2) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#0f0';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);

					ctx.closePath();
					ctx.stroke();
				});

				// var z = 3;
				// var z = (Math.asin(Math.sin(time / 400)) + Math.PI/2) / Math.PI * 3;
				[
					[ point(0, 0, z), point(2, 0, z) ],
					[ point(0, 1, z), point(2, 1, z) ],
					[ point(0, 0, z), point(0, 1, z) ],
					[ point(2, 0, z), point(2, 1, z) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#fff';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);

					ctx.closePath();
					ctx.stroke();
				});

				// // var x = 1.75;
				// var x = Math.cos(time / 200) + 1;
				// var y = 0;
				// var y = Math.sin(time / 200)*0.5 + 0.5;
				[
					point(x, y, z),
				].forEach(function(p1) {
					var pp1 = p1.transform();

					// ctx.fillStyle = '#00f';
					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);

					ctx.fillStyle = '#f00';
					ctx.beginPath();
					ctx.arc(pp1.x, pp1.y, h/21 * pp1.scale, 0, 2 * Math.PI);
					ctx.closePath();
					ctx.fill();
				});

				var pw = 1/5;
				var ph = pw * 2/3;

				// var fx = 0.75;
				// var fy = 0.35;
				[
					[
						point(fx - pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy + ph/2, 0),
						point(fx - pw/2, fy + ph/2, 0),
					],
					[
						point(fx - pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy + ph/2, 3),
						point(fx - pw/2, fy + ph/2, 3),
					]

				].forEach(function(points, i) {

					if(i == 0) {
						ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
					}
					if(i == 1) {
						ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
					}
					ctx.beginPath();
					points.forEach(function(p1, i) {
						var pp1 = p1.transform();
						if(i == 0) {
							ctx.moveTo(pp1.x, pp1.y);
						} else {
							ctx.lineTo(pp1.x, pp1.y);
						}
					});
					ctx.closePath();
					ctx.fill();

				});

				// [
				// 	// [ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 - 1/3) ],
				// 	[ point(1.25, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// ].forEach(function(line) {
				// 	var p1 = line[0];
				// 	var p2 = line[1];

				// 	var pp1 = p1.transform();
				// 	var pp2 = p2.transform();

				// 	ctx.strokeStyle = '#0f0';
				// 	ctx.beginPath();

				// 	// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
				// 	ctx.moveTo(pp1.x, pp1.y);
				// 	ctx.lineTo(pp2.x, pp2.y);

				// 	ctx.closePath();
				// 	ctx.stroke();
				// });


				ctx.restore();

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('testGame7', ['touch', 'size', 'socket', function(touch, size, socket) {
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

			var rotation = {x: 0, y: 0, z: 0};

			var paddlePos = {x: w / 4, y: h*7/9};
			// var ballPos = {x: 0, y: 0, z: 0};
		
			function update(time) {
				var tap = touch.getTap();
				if(tap) {
					paddlePos.x = tap.x;
					paddlePos.y = tap.y;
				}
			}

			requestAnimationFrame(function render(time) {
				update(time);

				ctx.save();
				ctx.clearRect(0, 0, w, h);

				ctx.translate(w / 4, 0);
				ctx.scale(1/2, 1/2);

				// ctx.strokeStyle = '#f00';
				ctx.lineWidth = 10;

				var magic = 1;

				var X = 2, Y = 1, Z = 3;


				function point(x, y, z) {
					return new Point(x, y, z);
				}
				function Point(x, y, z) {
					this.x = x;
					this.y = y;
					this.z = z;
				}
				Point.prototype = {
					transform1: function() {
						var k = 0.5/4;
						var s = 1 - 2*k;
						var tx = k*w*(Math.pow(s, this.z) - 1)/(s-1);
						var ty = k*h*(Math.pow(s, this.z) - 1)/(s-1);
						var scale = Math.pow(s, this.z);
					
						var scaleX = scale * w / X;
						var scaleY = scale * h;
						var scaleZ = scale;

						var p = new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
						p.scale = scale;
						return p;
						// return new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
					},
					transform2: function() {
						var k = 0.24 * this.x / X;
						var s = 1 - 2*k;

						var tx = this.x == 0 ? 0 : k*w*(Math.pow(s, magic) - 1)/(s-1);
						var ty = this.x == 0 ? 0 : k*h*(Math.pow(s, magic) - 1)/(s-1);
					
						var scale = Math.pow(s, magic);
						var scaleX = scale;
						var scaleY = scale * h;
						var scaleZ = scale * w / Z;

						var p = new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
						p.scale = scale;
						return p;
						// return new Point(this.x*scaleX + tx + this.z*scaleZ, this.y*scaleY + ty);
					},
					transform: function() {
						var interp = (Math.asin(Math.sin(time / 800)) + Math.PI/2) / Math.PI;
						// interp = interp*interp*(3 - 2*interp);
						// interp = interp*interp*interp*(interp*(interp*6 - 15) + 10);
						interp = interp*interp*interp*interp*(35 + interp*(-84 + interp*(70 - interp*20)));
						// -20x^7+70x^6-84x^5+35x^4

						var p1 = this.transform1();
						var p2 = this.transform2();

						var p =  Point.add(Point.scale(p1, interp), Point.scale(p2, 1 - interp));
						p.scale = p1.scale * interp + p2.scale * (1 - interp);
						return p;
					}
				};
				Point.scale = function(p, s) {
					return point(p.x * s, p.y * s, p.z * s);
				};
				Point.add = function(p1, p2) {
					return point(p1.x + p2.x, p1.y + p2.y, p1.x + p2.x);
				};

				[
					[ point(0, 0, 0), point(0, 0, 3) ],
					[ point(0, 1, 0), point(0, 1, 3) ],

					[ point(2, 0, 0), point(2, 0, 3) ],
					[ point(2, 1, 0), point(2, 1, 3) ],

					[ point(0, 0, 0), point(0, 1, 0) ],
					[ point(2, 0, 0), point(2, 1, 0) ],

					[ point(0, 0, 3), point(0, 1, 3) ],
					[ point(2, 0, 3), point(2, 1, 3) ],

					[ point(0, 0, 0), point(2, 0, 0) ],
					[ point(0, 0, 3), point(2, 0, 3) ],
					[ point(0, 1, 3), point(2, 1, 3) ],
					[ point(0, 1, 0), point(2, 1, 0) ],

					[ point(0, 0, 1), point(2, 0, 1) ],
					[ point(0, 1, 1), point(2, 1, 1) ],
					[ point(0, 0, 1), point(0, 1, 1) ],
					[ point(2, 0, 1), point(2, 1, 1) ],

					[ point(0, 0, 2), point(2, 0, 2) ],
					[ point(0, 1, 2), point(2, 1, 2) ],
					[ point(0, 0, 2), point(0, 1, 2) ],
					[ point(2, 0, 2), point(2, 1, 2) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#0f0';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);

					ctx.closePath();
					ctx.stroke();
				});

				// var z = 3;
				// var z = (Math.asin(Math.sin(time / 400)) + Math.PI/2) / Math.PI * 3;
				[
					[ point(0, 0, z), point(2, 0, z) ],
					[ point(0, 1, z), point(2, 1, z) ],
					[ point(0, 0, z), point(0, 1, z) ],
					[ point(2, 0, z), point(2, 1, z) ],
				].forEach(function(line) {
					var p1 = line[0];
					var p2 = line[1];

					var pp1 = p1.transform();
					var pp2 = p2.transform();

					ctx.strokeStyle = '#fff';
					ctx.beginPath();

					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
					ctx.moveTo(pp1.x, pp1.y);
					ctx.lineTo(pp2.x, pp2.y);

					ctx.closePath();
					ctx.stroke();
				});

				// // var x = 1.75;
				// var x = Math.cos(time / 200) + 1;
				// var y = 0;
				// var y = Math.sin(time / 200)*0.5 + 0.5;

				var pw = 1/5;
				var ph = pw * 2/3;

				// var fx = 0.75;
				// var fy = 0.35;
				[
					[
						point(fx - pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy - ph/2, 3),
						point(fx + pw/2, fy + ph/2, 3),
						point(fx - pw/2, fy + ph/2, 3),
					]

				].forEach(function(points, i) {

					ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
					
					ctx.beginPath();
					points.forEach(function(p1, i) {
						var pp1 = p1.transform();
						if(i == 0) {
							ctx.moveTo(pp1.x, pp1.y);
						} else {
							ctx.lineTo(pp1.x, pp1.y);
						}
					});
					ctx.closePath();
					ctx.fill();

				});

				[
					point(x, y, z),
				].forEach(function(p1) {
					var pp1 = p1.transform();

					// ctx.fillStyle = '#00f';
					// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);

					ctx.fillStyle = '#f00';
					ctx.beginPath();
					ctx.arc(pp1.x, pp1.y, h/21 * pp1.scale, 0, 2 * Math.PI);
					ctx.closePath();
					ctx.fill();
				});

				[
					[
						point(fx - pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy - ph/2, 0),
						point(fx + pw/2, fy + ph/2, 0),
						point(fx - pw/2, fy + ph/2, 0),
					]

				].forEach(function(points, i) {

					ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
					
					ctx.beginPath();
					points.forEach(function(p1, i) {
						var pp1 = p1.transform();
						if(i == 0) {
							ctx.moveTo(pp1.x, pp1.y);
						} else {
							ctx.lineTo(pp1.x, pp1.y);
						}
					});
					ctx.closePath();
					ctx.fill();

				});

				// [
				// 	// [ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(0.75, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 - 1/3) ],
				// 	[ point(1.25, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(1.25, 0.25, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],

				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(1.25, 0.75, 1.5 - 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 - 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(1.25, 0.25, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.25, 1.5 + 1/3), point(0.75, 0.75, 1.5 + 1/3) ],

				// 	[ point(1.25, 0.25, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],
				// 	[ point(0.75, 0.75, 1.5 + 1/3), point(1.25, 0.75, 1.5 + 1/3) ],

				// ].forEach(function(line) {
				// 	var p1 = line[0];
				// 	var p2 = line[1];

				// 	var pp1 = p1.transform();
				// 	var pp2 = p2.transform();

				// 	ctx.strokeStyle = '#0f0';
				// 	ctx.beginPath();

				// 	// ctx.fillRect(pp1.x - 10, pp1.y - 10, 20, 20);
				
				// 	ctx.moveTo(pp1.x, pp1.y);
				// 	ctx.lineTo(pp2.x, pp2.y);

				// 	ctx.closePath();
				// 	ctx.stroke();
				// });


				ctx.restore();

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

			var paddlePos = point(fx - 1, fy - 0.5, 0.2);
			var ballPos = point(-0.3, -0.1, 0);
			var ballVel = point(0, 0, 1.5);

			function update(time) {
			// 	var tap = touch.getTap();
			// 	if(tap) {
			// 		paddlePos.x = (tap.x - w/2) / (w/2) * 2;
			// 		paddlePos.y = (tap.y - h/2) / (h/2) * 1;
			// 	}
			}

			var fx = 0;
			var fy = 0;
			// var fx = 0, fy = 0;

			element.on('mousemove', function(e) {
				fx = e.layerX * 2/345 - 1;
				fy = e.layerY / 173;
			});

			var first = true;

			// var lastTime = null;
			var lastTime = 0;
			requestAnimationFrame(function tick(time) {

				update(time);

				// if(!lastTime) lastTime = time;

				// var dt = (time - lastTime) / 1400;
				var dt = (time - lastTime) / 1000;

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

				var i = (Math.asin(Math.sin(time / 800)) + Math.PI/2) / Math.PI;
				i = i*i*i*i*(35 + i*(-84 + i*(70 - i*20)));

				var ii = (Math.asin(Math.sin(time / 800 * 2)) + Math.PI/2) / Math.PI;
				ii = ii*ii*ii*ii*(35 + ii*(-84 + ii*(70 - ii*20)));

				var iii = (Math.asin(Math.sin(time / 800 * 2)) + Math.PI/2) / Math.PI;
				// iii = iii*iii*iii*iii*(35 + iii*(-84 + iii*(70 - iii*20)));


				mat4.translate(camera, camera, vec4.fromValues(0, 0, i*1.5, 0));
				// mat4.translate(camera, camera, vec4.fromValues(0, 0, 1.5, 0));

				var a = time / 500;

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


				var lastPaddlePos = paddlePos;
				paddlePos = point(fx - 1, fy - 0.5, 0);
				// ballPos = point(ballPos[0], ballPos[1], iii * 3);
				// ballPos = point(ballPos[0], ballPos[1], iii * 3);
				var ball = mat4.create();
				mat4.translate(ball, ball, vec4.fromValues(ballVel[0] * dt, ballVel[1] * dt, ballVel[2] * dt, 0));
				vec3.transformMat4(ballPos, ballPos, ball);

				var paddleVel = vec4.create();
				vec4.subtract(paddleVel, paddlePos, lastPaddlePos);

				if(ballPos[2] >= 3) {
					ballPos = point(ballPos[0], ballPos[1], 3);

					ballVel = point(paddleVel[0] * 4, -paddleVel[1] * 4, -ballVel[2]);
					// ballVel = point(paddleVel[0], paddleVel[1], -ballVel[2]);
				}
				if(ballPos[2] <= 0) {
					ballPos = point(ballPos[0], ballPos[1], 0);
					// ballVel = point(0, 0, -ballVel[2]);
					ballVel = point(paddleVel[0] * 4, -paddleVel[1] * 4, -ballVel[2]);
					// vec4.normalize(ballVel, ballVel);
				}
				if(ballPos[1] >= 0.5) {
					ballPos = point(ballPos[0], 0.5, ballPos[2]);
					ballVel = point(ballVel[0], -ballVel[1], ballVel[2]);
				}
				if(ballPos[1] <= -0.5) {
					ballPos = point(ballPos[0], -0.5, ballPos[2]);
					ballVel = point(ballVel[0], -ballVel[1], ballVel[2]);
				}

				if(ballPos[0] >= 1) {
					ballPos = point(1, ballPos[1], ballPos[2]);
					ballVel = point(-ballVel[0], ballVel[1], ballVel[2]);
				}
				if(ballPos[0] <= -1) {
					ballPos = point(-1, ballPos[1], ballPos[2]);
					ballVel = point(-ballVel[0], ballVel[1], ballVel[2]);
				}

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

				var pw = 0.15;
				var ph = pw * 2/3;
				ctx.beginPath();
				[
					point(-pw + ballPos[0], -ph + ballPos[1], 3),
					point(pw + ballPos[0], -ph + ballPos[1], 3),
					point(pw + ballPos[0], ph + ballPos[1], 3),
					point(-pw + ballPos[0], ph + ballPos[1], 3),
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
				ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
				ctx.fill();

				var br = 0.1;

				[
					[
						point(ballPos[0], ballPos[1], ballPos[2] + br),
						point(ballPos[0] + br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] + br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] + br),
						point(ballPos[0] - br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] + br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] + br),
						point(ballPos[0] + br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] - br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] + br),
						point(ballPos[0] - br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] - br, ballPos[2]),
					],

					[
						point(ballPos[0], ballPos[1], ballPos[2] - br),
						point(ballPos[0] + br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] + br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] - br),
						point(ballPos[0] - br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] + br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] - br),
						point(ballPos[0] + br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] - br, ballPos[2]),
					],
					[
						point(ballPos[0], ballPos[1], ballPos[2] - br),
						point(ballPos[0] - br, ballPos[1], ballPos[2]),
						point(ballPos[0], ballPos[1] - br, ballPos[2]),
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
					ctx.fillStyle = '#f00';
					ctx.fill();
				});

				ctx.beginPath();
				for(var v = 0; v <= Math.PI * 2; v += Math.PI * 2 / 16) {
					var b = point(Math.cos(v) * 0.1 + ballPos[0], Math.sin(v) * 0.1 + ballPos[1], ballPos[2]);
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
				ctx.fillStyle = '#f00';
				ctx.fill();

				ctx.beginPath();
				for(var v = 0; v <= Math.PI * 2; v += Math.PI * 2 / 16) {
					var b = point(ballPos[0], Math.sin(v) * 0.1 + ballPos[1], Math.cos(v) * 0.1 + ballPos[2]);
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
				ctx.fillStyle = '#f00';
				ctx.fill();

				ctx.beginPath();
				[
					point(-pw + paddlePos[0], -ph - paddlePos[1], paddlePos[2]),
					point(pw + paddlePos[0], -ph - paddlePos[1], paddlePos[2]),
					point(pw + paddlePos[0], ph - paddlePos[1], paddlePos[2]),
					point(-pw + paddlePos[0], ph - paddlePos[1], paddlePos[2]),
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
				ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
				ctx.fill();

				ctx.restore();

				lastTime = time;

				first = false;

				requestAnimationFrame(tick);
			});
		}
	};
}]);