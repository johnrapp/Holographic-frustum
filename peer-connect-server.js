var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var ExpressPeerServer = require('peer').ExpressPeerServer;

var port = 8088;

server.listen(port, function(){
	console.log('listening on *:', port);
});

app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

app.use('/peerjs', ExpressPeerServer(server, {debug: true}));

app.post('/register', function(req, res) {
	console.log(req.body);
	res.send({role: 'master'});
});

var peerjs = io.of('/peerjs');
peerjs.on('connection', function(socket) {
	console.log('connection!');

	socket.on('register', function(id) {

	});

	socket.on('disconnect', function() {
      console.log('disconnect!');
   });
});