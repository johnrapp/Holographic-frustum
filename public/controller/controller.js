'use strict';
angular.module('app', ['ngMaterial', 'lib'])
.config(['socketProvider', function(socketProvider) {
	socketProvider.namespace = 'controller';
}])
.controller('controller', ['$scope', 'socket', function($scope, socket) {
	$scope.refresh = function() {
		socket.emit('refreshDisplay');
	};
	$scope.rotate = function() {
		socket.emit('rotateDisplay');
	};
}])
.directive('touchArea', ['socket', function(socket) {
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			// element[0].addEventListener('touchstart', function(e) {
			// 	var touch = e.touches[0];
			// 	var position = {x: touch.clientX / element[0].offsetWidth, y: touch.clientY / element[0].offsetHeight};

			// 	socket.emit('touchstart', position);
			// }, false);

			// element[0].addEventListener('touchend', function(e) {
			// 	socket.emit('touchend');
			// }, false);
			
			// element[0].addEventListener('touchcancel', function(e) {
			// 	socket.emit('touchend');
			// }, false);
			
			// element[0].addEventListener('touchmove', function(e) {
			// 	var touch = e.touches[0];
			// 	var position = {x: touch.clientX / element[0].offsetWidth, y: touch.clientY / element[0].offsetHeight};

			// 	socket.emit('touchmove', position);
			// }, false);

			var hammertime = new Hammer(element[0], {});
			hammertime.get('pinch').set({ enable: true });
			hammertime.get('rotate').set({ enable: true });

			hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

			var position = null;
			hammertime.on('panstart', function(e) {
				position = {x: e.deltaX, y: e.deltaY};
			});
			hammertime.on('panend', function(e) {
				position = null;
			});

			hammertime.on('panmove', function(e) {
				if(position) {
					var delta = {x: (e.deltaX - position.x), y: (e.deltaY - position.y)};
					console.log(e.deltaX, e.deltaY);
					socket.emit('pan', delta);
					position = {x: e.deltaX, y: e.deltaY};
				}
			});

			hammertime.on('rotate', function(e) {
				socket.emit('rotateCube', e.rotation);
			});

			hammertime.on('pinch', function(e) {
				socket.emit('scale', e.scale);
			});

			var scale = 1;
			document.addEventListener('mousewheel', function(e) {
				scale += e.wheelDelta / 120 * 0.05;
				socket.emit('scale', scale);
			});

		}
	}
}]);