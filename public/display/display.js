var socket = io('/display');
socket.on('refresh', function() {
	location.reload();
});

socket.on('disconnect', function() {
	setTimeout(function() {
		location.reload();
	}, 3000);
});

angular.module('app', ['ngMaterial'])
.directive('cube', [function() {
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
		// template: '<div id="clock"><span class="h" h="{{h}}">{{h}}</span><span class="m" m="{{m}}">{{h}}</span><span class="s" s="{{s}}">{{h}}</span></div>',
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
.directive('animationTest', [function() {
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
.directive('touchTest', [function() {
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
				if(tap) {
					ctx.fillRect(tap.x, tap.y, 50, 50);
				}

				requestAnimationFrame(render);
			});
		}
	};
}]);

var container = $('#container');
var size = Math.min(window.innerWidth, window.innerHeight);
var middle = size / 2;

window.addEventListener('click', function(e) {
	container.webkitRequestFullScreen();
});

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
socket.on('rotate', function() {
	var child = container.querySelector('div:first-child');
	container.removeChild(child);
	container.appendChild(child);
});

// requestAnimationFrame(function render(time) {
// 	renderScreens.forEach(function(renderScreen, i) {
// 		var ctx = ctxes[i];
// 		ctx.clearRect(0, 0, size, size);
	

// 		renderScreen(ctx, time);
// 	});

// 	requestAnimationFrame(render);
	
// });