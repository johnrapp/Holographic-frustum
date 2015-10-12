angular.module('app')
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
			element.append(renderer.domElement);

			// var geometry = new THREE.BoxGeometry(1, 1, 1);
			// var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
			// material.opacity = 0.01;
			// var cube = new THREE.Mesh(geometry, material);
			// scene.add(cube);

			var light = new THREE.PointLight(0xffffff, 1, 100);
			light.position.set(0, 0, 5);
			scene.add(light);

			var a = 10, b = 10, c = 10;

			var sides = {
				left: [],
				right: [],
				front: [],
				back: [],
			};

			sides.front.left = sides.left;
			sides.front.right = sides.right;
			sides.front.length = a;
			sides.front.invert = false;

			sides.right.left = sides.front;
			sides.right.right = sides.back;
			sides.right.length = c;
			sides.right.invert = true;

			sides.back.left = sides.right;
			sides.back.right = sides.left;
			sides.back.length = a;
			sides.back.invert = true;

			sides.left.left = sides.back;
			sides.left.right = sides.front;
			sides.left.length = c;
			sides.left.invert = false;

			window.sides = sides;

			for(var key in sides) {
				var side = sides[key];

				for(var i = 0; i < side.length; i++) {
					side[i] = [];
				}
			}

			var player = {
				pos: new THREE.Vector2(0, 0),
				dir: new THREE.Vector2(1, 0),
				side: sides.front
			};

			var cubes = new THREE.Group();

			window.cubes = cubes;

			generateScene(a, b, c);

			function generateScene(a, b, c) {
				var padding = 0.1;
				var scale = .5;
				// var offset = new THREE.Vector3(-a / 2, -b / 2, -c / 2);
				var offset = new THREE.Vector3(-a / 4, -b / 4, -c / 2);

				for(var x = 0; x < a; x++) {
					for(var y = 0; y < b; y++) {
						for(var z = 0; z < c; z++) {

							var leftSide = x == 0;
							var rightSide = x == a - 1;
							var backSide = z == 0;
							var frontSide = z == c - 1;

							if(!leftSide && !rightSide && !frontSide && !backSide) {
								continue;
							}

							var geometry = new THREE.BoxGeometry(scale, scale, scale);
							var material = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true });
							material.opacity = 0.4;
							var cube = new THREE.Mesh(geometry, material);
							cube.position.set(x * scale + padding * x + offset.x, y * scale + padding * y + offset.y, z * scale + padding * z + offset.z);
							
							cubes.add(cube);

							if(frontSide) {
								sides.front[x][y] = {object: cube};
							}
							if(backSide) {
								sides.back[a - x - 1][y] = {object: cube};
							}
							if(leftSide) {
								sides.left[z][y] = {object: cube};
							}
							if(rightSide) {
								sides.right[c - z - 1][y] = {object: cube};
							}
						}
					}
				}

			}

			scene.add(cubes);
		    // cubes.rotateX(0.05);
		    // cubes.position = cubes.position.add(new THREE.Vector3(0, -1, 0));

			// var loader = new THREE.OBJMTLLoader();

			// var object;

			// load an obj / mtl resource pair
			// loader.load(
			// 	// OBJ resource URL
			// 	'obj/THACUBE.obj',
			// 	// MTL resource URL
			// 	'obj/THACUBE.mtl',
			// 	// Function when both resources are loaded
			// 	function (_object) {
			// 		object = _object;
			// 		// object.scale.set(3, 3, 3);
			// 		object.position.set(0, -3, -5);
			// 		scene.add(object);

			// 		object.children.forEach(function(child) {
			// 			child.geometry.computeVertexNormals();
			// 			child.geometry.mergeVertices();
			// 		});

			// 		var light = new THREE.PointLight(0xffffff, 1, 100);
			// 		light.position.set(0, 0, 5);
			// 		scene.add(light);
			// 		// var cube = new THREE.Mesh(geometry, material);
			// 		// scene.add(cube);
			// 	},
			// 	// Function called when downloads progress
			// 	function (xhr) {
			// 		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			// 	},
			// 	// Function called when downloads error
			// 	function (xhr) {
			// 		console.log('An error happened');
			// 	}
			//);

			// instantiate a loader
			// var loader = new THREE.JSONLoader();

			// // load a resource
			// loader.load(
			// 	// resource URL
			// 	'benanimation.js',
			// 	// Function when resource is loaded
			// 	function (geometry, materials) {
			// 		var material = new THREE.MeshFaceMaterial(materials);
			// 		var object = new THREE.Mesh(geometry, material);
			// 		scene.add(object);
			// 	}
			//);
			// var loader = new THREE.SceneLoader();

			// loader.load("benanimation.js", function(result) {
			// 	console.log(result)
			// });

			 // var loader = new THREE.ObjectLoader();
    //         // loader.load('scene.json', function (object) {
    //         loader.load('benanimation.json', function (object) {

    //                     scene = object;

    //                     var light = new THREE.PointLight(0xffffff, 1, 100);
				// 	light.position.set(0, 0, 5);
				// 	scene.add(light);

    //         });

			// function morphColorsToFaceColors(geometry) {

			// 	if (geometry.morphColors && geometry.morphColors.length) {

			// 		var colorMap = geometry.morphColors[ 0 ];

			// 		for (var i = 0; i < colorMap.colors.length; i ++) {

			// 			geometry.faces[ i ].color = colorMap.colors[ i ];
			// 			geometry.faces[ i ].color.offsetHSL(0, 0.3, 0);

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

				function invert(dir) {
					return player.side.invert ? dir.multiplyScalar(-1) : dir;
				}

				if(keyboard.isDown('left')) {
					player.dir = invert(new THREE.Vector2(-1, 0));
				}
				if(keyboard.isDown('right')) {
					player.dir = invert(new THREE.Vector2(1, 0));
				}
				if(keyboard.isDown('up')) {
					player.dir = new THREE.Vector2(0, 1);
				}
				if(keyboard.isDown('down')) {
					player.dir = new THREE.Vector2(0, -1);
				}

				var object = player.side[player.pos.x][player.pos.y].object;
				object.material.color.setHex(0xff0000);

				player.pos = player.pos.add(player.dir);
				if(player.pos.x < 0) {
					player.side = player.side.left;
					player.pos = new THREE.Vector2(player.side.length - 2, player.pos.y);
				}
				if(player.pos.x >= player.side.length) {
					player.side = player.side.right;
					player.pos = new THREE.Vector2(1, player.pos.y);
				}
			}, 300);

			requestAnimationFrame(function render(time) {
				update(time);
				
				renderer.render(scene, camera);

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