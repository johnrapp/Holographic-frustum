angular.module('app', ['ngMaterial'])
.controller('controller', ['$scope', function($scope) {
	$scope.refresh = function() {
		socket.emit('refreshDisplay');
	};
	$scope.rotate = function() {
		socket.emit('rotateDisplay');
	};
}]);

var socket = io('/controller');
	
function debug(text) {
	$('#debug').textContent += text + '\n';
}

window.addEventListener("touchstart", function(e) {
	// debug('touchstart');
	var touch = e.touches[0];
	var position = {x: touch.clientX, y: touch.clientY};
	// console.log(position);
	socket.emit('touchstart', position);
}, false);
window.addEventListener("touchend", function(e) {
	// debug('touchend');
	socket.emit('touchend');
}, false);
window.addEventListener("touchcancel", function(e) {
	// debug('touchcancel');
	socket.emit('touchend');
}, false);
window.addEventListener("touchmove", function(e) {
	// debug('touchmove');
	var touch = e.touches[0];
	var position = {x: touch.clientX, y: touch.clientY};
	// console.log(position);
	socket.emit('touchmove', position);
}, false);
