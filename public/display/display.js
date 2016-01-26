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
				console.log(Object.keys(element[0].__proto__.__proto__.__proto__));
				// element[0].webkitRequestFullScreen();
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
.directive('testGame', ['touch', 'size', 'socket', function(touch, size, socket) {
	return {
		restrict: 'E',
		replace: true,
		template: '<div></div>',
		link: function(scope, element, attr) {
			var w = size, h = size / 2;

			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

			var renderer = new THREE.WebGLRenderer();
			renderer.setSize(w, h);
			element.append(renderer.domElement);

			var geometry = new THREE.BoxGeometry(1, 1, 1);
			// var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
			var material = new THREE.MeshLambertMaterial({ color: 0xffffff });
			// var material = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true });
			// material.opacity = 0.01;
			var cube = new THREE.Mesh(geometry, material);
			cube.position.set(0, 0, 0);
			scene.add(cube);

			var geometry2 = new THREE.BoxGeometry(100, 100, 1);
			var material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
			var cube2 = new THREE.Mesh(geometry2, material2);
			cube2.position.set(0, 0, -20);
			scene.add(cube2);

			var geometry3 = new THREE.BoxGeometry(2, 1, 1);
			var material3 = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true  });
			material3.opacity = 0.7;
			var cube3 = new THREE.Mesh(geometry3, material3);
			cube3.position.set(0, 0, 1);
			scene.add(cube3);

			var geometry4 = new THREE.BoxGeometry(2, 1, 1);
			var material4 = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true  });
			material4.opacity = 0.7;
			var cube4 = new THREE.Mesh(geometry4, material4);
			cube4.position.set(0, 0, 1);
			scene.add(cube4);

			var geometry5 = new THREE.BoxGeometry(1, 1, 10);
			var material5 = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true  });
			var cube5 = new THREE.Mesh(geometry5, material5);
			cube5.position.set(0, 0, 0);
			scene.add(cube5);

			// var geometry6 = new THREE.BoxGeometry(0.3, 0.15, 0.0001);
			// var material6 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			// var cube6 = new THREE.Mesh(geometry6, material6);
			// cube6.position.set(0, 0, 5-0.1001);
			// scene.add(cube6);

			var geometry7 = new THREE.BoxGeometry(1, 2, 6);
			var material7 = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true  });
			material7.opacity = 0.9;
			var cube7 = new THREE.Mesh(geometry7, material7);
			cube7.position.set(-1, 0, 6-3);
			scene.add(cube7);

			var geometry8 = new THREE.BoxGeometry(1, 2, 6);
			var material8 = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true  });
			material8.opacity = 0.9;
			var cube8 = new THREE.Mesh(geometry8, material8);
			cube8.position.set(1, 0, 6-3);
			scene.add(cube8);

			var geometry9 = new THREE.BoxGeometry(1, 1, 6);
			var material9 = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true  });
			material9.opacity = 0.9;
			var cube9 = new THREE.Mesh(geometry9, material9);
			cube9.position.set(0, -1, 6-3);
			scene.add(cube9);

			var geometry10 = new THREE.BoxGeometry(1, 1, 6);
			var material10 = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true  });
			material10.opacity = 0.9;
			var cube10 = new THREE.Mesh(geometry10, material10);
			cube10.position.set(0, 1, 6-3);
			scene.add(cube10);


			var light = new THREE.PointLight(0xffffff, 1, 100);
			light.position.set(0, 0, 5);
			scene.add(light);


			camera.position.z = 5;
			// camera.position.y = -0.3;

			function update(time) {
				cube.rotation.x = 0.001 * time;
				cube.rotation.y = 0.001 * time;
				// if(object) {
					// object.position.set(0, 0, 0)
					// object.rotation.x += 0.1;
					// object.rotation.y += 0.1;
					// object.position.set(0, -10, 0)
				// }

				// function randomInt(x) {return Math.floor(Math.random() * x);}
				// world[randomInt(a)][randomInt(b)][randomInt(c)].material.color = 0xff0000;
			}

			// keyboard.listen();
			// setInterval(function update() {

				
			// }, 300);

			requestAnimationFrame(function render(time) {
				update(time);
				
				renderer.render(scene, camera);

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('testGame2', ['touch', 'size', 'socket', function(touch, size, socket) {
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

			requestAnimationFrame(function render(time) {
				ctx.clearRect(0, 0, w, h);

				// ctx.fillStyle = '#00f';
				// ctx.fillRect(0, 0, w, h);

				ctx.strokeStyle = '#0f0';
				// ctx.strokeStyle = '#f00';
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo(w / 4, 0);
				ctx.lineTo(w / 4, h / 2);
				ctx.lineTo(w * 3/ 4, h / 2);
				ctx.lineTo(w * 3/ 4, 0);
				ctx.closePath();
				ctx.stroke();

				var lines = 4;
				// var lines = 4;
				for(var i = 1; i <= lines; i++) {
					var x = i/lines;
					var k = 0.6 * Math.pow(x, 0.75);
					// var k = 0.5 * Math.sqrt(x);
					// var k = 0.5 / i;

					ctx.beginPath();
					// ctx.strokeStyle = '#f00';
					ctx.moveTo(w / 4 - (w/4-w/2)*k, - (0-h/4) * k);
					ctx.lineTo(w / 4 - (w/4-w/2)*k, h / 2 - (h / 2-h/4) * k);
					ctx.lineTo(w * 3/ 4 - (w*3/4-w/2)*k, h / 2 - (h / 2-h/4) * k);
					ctx.lineTo(w * 3/ 4 - (w*3/4-w/2)*k, - (0-h/4) * k);

					ctx.closePath();
					ctx.stroke();
				}

				var k = 0.6;
				ctx.beginPath();
				// ctx.strokeStyle = '#f00';
				ctx.moveTo(w / 4, 0);
				ctx.lineTo(w / 4 - (w/4-w/2)*k, - (0-h/4) * k);

				ctx.moveTo(w / 4, h / 2);
				ctx.lineTo(w / 4 - (w/4-w/2)*k, h / 2 - (h / 2-h/4) * k);

				ctx.moveTo(w * 3/ 4, h / 2);
				ctx.lineTo(w * 3/ 4 - (w*3/4-w/2)*k, h / 2 - (h / 2-h/4) * k);
				
				ctx.moveTo(w * 3/ 4, 0);
				ctx.lineTo(w * 3/ 4 - (w*3/4-w/2)*k, - (0-h/4) * k);
				ctx.closePath();
				ctx.stroke();

				ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
				ctx.fillRect(w / 4 - (w/4-w/2)*k + w/6*k, h/8*k - (0-h/4) * k, w/10*k, h/9*k);

				ctx.fillStyle = '#f00';
				ctx.beginPath();
				ctx.arc(w/2 - w/100, h/4, h/21, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.fill();

				ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
				ctx.fillRect(w / 4 + w/6, h/8, w/10, h/9);

				requestAnimationFrame(render);
			});
		}
	};
}])
.directive('testGame3', ['touch', 'size', 'socket', function(touch, size, socket) {
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

			requestAnimationFrame(function render(time) {
				ctx.save();
				ctx.clearRect(0, 0, w, h);

				ctx.translate(w / 4, 0);
				ctx.scale(1/2, 1/2);

				ctx.strokeStyle = '#f00';
				// ctx.strokeStyle = '#f00';
				ctx.lineWidth = 10;

				ctx.save();

				var lines = 4;
				// var lines = 4;
				for(var i = 0; i < lines; i++) {
					if(i != 0) {
						// var k = 0.6;
						// var k = 0.21213203435596426;
						var k = 0.5/lines;
						ctx.translate(k*w, k*h);
						var scale = 1 - 2*k;
						ctx.scale(scale, scale);

						// ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
						// ctx.fillRect(w/8, h/2, 150, 150);
						// ctx.fillRect((w/8 - k*w)/scale, (h/2 - k*h)/scale, 150/scale, 150/scale);

						ctx.beginPath();

						ctx.moveTo((0 - k*w) / scale, (0 - k*h) / scale);
						ctx.lineTo(0, 0);

						ctx.moveTo((0 - k*w) / scale, (h - k*h) / scale);
						ctx.lineTo(0, h);

						ctx.moveTo((w - k*w) / scale, (h - k*h) / scale);
						ctx.lineTo(w, h);

						ctx.moveTo((w - k*w) / scale, (0 - k*h) / scale);
						ctx.lineTo(w, 0);

						ctx.closePath();
						ctx.stroke();
					} else {
						// ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
						// ctx.fillRect(w/8, h/2, 150, 150);3
					}

					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(0, h);
					ctx.lineTo(w, h);
					ctx.lineTo(w, 0);
					ctx.closePath();
					ctx.stroke();
				}

				var k = 0.6;
				
				ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
				ctx.fillRect(w / 4, h*7/9, w/10, h/9);

				ctx.restore();

				ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
				ctx.fillRect(w / 4, h*7/9, w/10, h/9);
				// ctx.fillRect(w / 4 + w/6, h/8, w/10, h/9);

				ctx.save();
				ctx.strokeStyle = '#fff';
				var line = (Math.sin(time / 400) + 1) / 2 * 3;
				// var line = 2.5;
				var k = 0.5/lines;
				var s = 1 - 2*k;
				ctx.translate(k*w*(Math.pow(s, line) - 1)/(s-1), k*h*(Math.pow(s, line) - 1)/(s-1));
				var scale = Math.pow(s, line);
				ctx.scale(scale, scale);

				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(0, h);
				ctx.lineTo(w, h);
				ctx.lineTo(w, 0);
				ctx.closePath();
				ctx.stroke();

				ctx.fillStyle = '#f00';
				ctx.beginPath();
				ctx.arc(w*3/5, h*4/7, h/21, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.fill();

				ctx.restore();


				ctx.restore();

				requestAnimationFrame(render);
			});
		}
	};
}]);;