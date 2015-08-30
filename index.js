var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = 8088;

server.listen(port, function(){
	console.log('listening on *:', port);
});

app.use(express.static('public'));

app.get('/display', function(req, res) {
	res.sendFile(__dirname + '/public/display.html');
});

app.get('/controller', function(req, res) {
	res.sendFile(__dirname + '/public/controller.html');
});

var display = io.of('/display');
display.on('connection', function(socket) {

});

var controller = io.of('/controller');
controller.on('connection', function(socket) {
	socket.on('refreshDisplay', function() {
		display.emit('refresh');
	});
	socket.on('rotateDisplay', function() {
		display.emit('rotate');
	});

	socket.on('touchstart', function(position) {
		display.emit('touchstart', position);
	});
	socket.on('touchend', function() {
		display.emit('touchend');
	});
	socket.on('touchmove', function(position) {
		display.emit('touchmove', position);
	});
});