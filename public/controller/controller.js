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

			var prevTouch = null;
			hammertime.on('pan', function(e) {
				// console.log('pan', e);
				var touch = e.pointers[0];
				if(prevTouch) {
					var delta = {x: touch.clientX - prevTouch.clientX, y: touch.clientY - prevTouch.clientY};
					// console.log(delta);
					socket.emit('pan', {x: delta.x / element[0].offsetWidth, y: delta.y / element[0].offsetHeight});
				}
				prevTouch = touch;
				// socket.emit('pan', {x: e.deltaX / element[0].offsetWidth, y: e.deltaY / element[0].offsetHeight});
			});

			hammertime.on('rotate', function(e) {
				socket.emit('rotateCube', e.rotation);
			});

			hammertime.on('pinch', function(e) {
				socket.emit('scale', e.scale);
			});
		}
	}
}]);