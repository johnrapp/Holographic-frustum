'use strict';
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);

Math.TAU = Math.PI * 2;

angular.module('lib', [])
.provider('socket', function() {
	this.namespace = '';
	this.$get = ['$window', function($window) {
		return $window.io('/' + this.namespace);
	}];
});