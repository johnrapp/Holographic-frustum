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
			element[0].addEventListener('touchstart', function(e) {
				var touch = e.touches[0];
				var position = {x: touch.clientX / element[0].offsetWidth, y: touch.clientY / element[0].offsetHeight};

				socket.emit('touchstart', position);
			}, false);

			element[0].addEventListener('touchend', function(e) {
				socket.emit('touchend');
			}, false);
			
			element[0].addEventListener('touchcancel', function(e) {
				socket.emit('touchend');
			}, false);
			
			element[0].addEventListener('touchmove', function(e) {
				var touch = e.touches[0];
				var position = {x: touch.clientX / element[0].offsetWidth, y: touch.clientY / element[0].offsetHeight};

				socket.emit('touchmove', position);
			}, false);
		}
	}
}]);