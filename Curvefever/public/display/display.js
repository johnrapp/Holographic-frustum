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
}])
.directive('curveFever', ['touch', 'size', 'socket', function(touch, size, socket) {
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
			element.append( renderer.domElement );

			// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
			// var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
			// material.opacity = 0.01;
			// var cube = new THREE.Mesh( geometry, material );
			// scene.add( cube );

			var light = new THREE.PointLight( 0xffffff, 1, 100 );
			light.position.set( 0, 0, 5 );
			scene.add( light );

			var a = 10, b = 10, c = 10;

			var world = [];
			for(var i = 0; i < a; i++) {
				world.push([]);
				for(var j = 0; j < b; j++) {
					world[i].push([0, 0, 0, 0]);
				}
			}

			var worldObjects = [];
			for(var i = 0; i < a; i++) {
				worldObjects.push([]);
				for(var j = 0; j < b; j++) {
					worldObjects[i].push([]);
				}
			}

			generateScene(a, b, c);


			var player = {
				pos: new THREE.Vector3(0, 0, c - 1),
				dir: new THREE.Vector3(1, 0, 0)
			};

			function generateScene(a, b, c) {
				var padding = 0.1;
				var scale = .5;
				// var offset = new THREE.Vector3(-a / 2, -b / 2, -c / 2);
				var offset = new THREE.Vector3(-a / 4, -b / 4, -c / 2);

				for(var x = 0; x < a; x++) {
					for(var y = 0; y < b; y++) {
						for(var z = 0; z < c; z++) {
							var geometry = new THREE.BoxGeometry( scale, scale, scale );
							var material = new THREE.MeshLambertMaterial( { color: 0xffffff, transparent: true } );
							material.opacity = 0.4;
							var cube = new THREE.Mesh( geometry, material );
							cube.position.set(x * scale + padding * x + offset.x, y * scale + padding * y + offset.y, z * scale + padding * z + offset.z);
							scene.add( cube );
							worldObjects[x][y][z] = cube;
						}
					}
				}

			}

			// var loader = new THREE.OBJMTLLoader();

			// var object;

			// load an obj / mtl resource pair
			// loader.load(
			// 	// OBJ resource URL
			// 	'obj/THACUBE.obj',
			// 	// MTL resource URL
			// 	'obj/THACUBE.mtl',
			// 	// Function when both resources are loaded
			// 	function ( _object ) {
			// 		object = _object;
			// 		// object.scale.set(3, 3, 3);
			// 		object.position.set(0, -3, -5);
			// 		scene.add( object );

			// 		object.children.forEach(function(child) {
			// 			child.geometry.computeVertexNormals();
			// 			child.geometry.mergeVertices();
			// 		});

			// 		var light = new THREE.PointLight( 0xffffff, 1, 100 );
			// 		light.position.set( 0, 0, 5 );
			// 		scene.add( light );
			// 		// var cube = new THREE.Mesh( geometry, material );
			// 		// scene.add( cube );
			// 	},
			// 	// Function called when downloads progress
			// 	function ( xhr ) {
			// 		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			// 	},
			// 	// Function called when downloads error
			// 	function ( xhr ) {
			// 		console.log( 'An error happened' );
			// 	}
			// );

			// instantiate a loader
			// var loader = new THREE.JSONLoader();

			// // load a resource
			// loader.load(
			// 	// resource URL
			// 	'benanimation.js',
			// 	// Function when resource is loaded
			// 	function ( geometry, materials ) {
			// 		var material = new THREE.MeshFaceMaterial( materials );
			// 		var object = new THREE.Mesh( geometry, material );
			// 		scene.add( object );
			// 	}
			// );
			// var loader = new THREE.SceneLoader();

			// loader.load( "benanimation.js", function(result) {
			// 	console.log(result)
			// } );

			 // var loader = new THREE.ObjectLoader();
    //         // loader.load( 'scene.json', function ( object ) {
    //         loader.load( 'benanimation.json', function ( object ) {

    //                     scene = object;

    //                     var light = new THREE.PointLight( 0xffffff, 1, 100 );
				// 	light.position.set( 0, 0, 5 );
				// 	scene.add( light );

    //         } );

			// function morphColorsToFaceColors( geometry ) {

			// 	if ( geometry.morphColors && geometry.morphColors.length ) {

			// 		var colorMap = geometry.morphColors[ 0 ];

			// 		for ( var i = 0; i < colorMap.colors.length; i ++ ) {

			// 			geometry.faces[ i ].color = colorMap.colors[ i ];
			// 			geometry.faces[ i ].color.offsetHSL( 0, 0.3, 0 );

			// 		}

			// 	}

			// }

			camera.position.z = 5;

			function update(time) {
				// if(object) {
					// object.position.set(0, 0, 0)
					// object.rotation.x += 0.1;
					// object.rotation.y += 0.1;
					// object.position.set(0, -10, 0)
				// }

				// function randomInt(x) {return Math.floor(Math.random() * x);}
				// world[randomInt(a)][randomInt(b)][randomInt(c)].material.color = 0xff0000;
			}

			keyboard.listen();
			setInterval(function update() {
				if(keyboard.isDown('left')) {
					player.dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
				}
				if(keyboard.isDown('right')) {
					player.dir = new THREE.Vector3(1, 0, 0);
				
				}
				if(keyboard.isDown('up')) {
				
				}
				if(keyboard.isDown('down')) {
				
				}

				// var object = worldObjects[player.pos.x][player.pos.y][player.pos.z];
				// object.material.color.setHex(0xff0000);
				// player.pos = player.pos.add(player.dir);
				window.dir = player.dir;
			}, 300);

			requestAnimationFrame(function render(time) {
				update(time);
				
				renderer.render( scene, camera );

				requestAnimationFrame(render);
			});
		}
	};
}]);

(function() {'use strict';

	var keys = {}, keyMap = {
		37: 'left',
		39: 'right',
		38: 'up',
		40: 'down',

		87: 'w',
		65: 'a',
		83: 's',
		68: 'd',

		13: 'enter',
		32: 'space'
	};

	window.keys = keys;

	function listen() {
		window.addEventListener('keydown', onkeydown);
		window.addEventListener('keyup', onkeyup);
	}

	function cancel() {
		window.removeEventListener('keydown', onkeydown);
		window.removeEventListener('keyup', onkeyup);
	}

	function onkeydown(e) {
		if(keyMap.hasOwnProperty(e.which)) {
			keys[keyMap[e.which]] = 1;
			e.preventDefault();
		}
	}

	function onkeyup(e) {
		if(keyMap.hasOwnProperty(e.which)) {
			keys[keyMap[e.which]] = 0;
			e.preventDefault();
		}
	}

	function keydown(key) {
		return keys[key];
	}

	window.keyboard = {
		isDown: keydown,
		listen: listen,
		cancel: cancel,
		mapKey: function(which) {
			return keyMap[which];
		}
	};

})();