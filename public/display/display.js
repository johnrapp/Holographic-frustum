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
.directive('touchTest', ['touch', 'size', function(touch, size) {
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

				ctx.fillStyle = '#f00';
				var tap = touch.getTap();
				if(tap) {
					ctx.fillRect(tap.x, tap.y, 50, 50);
				}

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
				window.setCubeRotation(rotation.x * 100, rotation.y * 100, -rotation.z);
				var scale = touch.getScale();
				window.setCubeScale(scale);

				requestAnimationFrame(render);
			});
		}
	};
}]);