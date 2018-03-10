var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 9999;
var io = require('socket.io')(http);

var users = []; // list of current users
var log = []; // chat log history
// display chat room UI
app.use(express.static(__dirname + '/public'));

// client connection handler
io.on('connection', function(socket){
	// client connected, set user name to default
	console.log(socket.id + ' connected');
	var newName = "User" + socket.id;
	io.to(socket.id).emit('set nickname', newName);
	users.push({customId:newName, clientId:socket.id, color:"red"});
	var user = users[users.length - 1];
	console.log("Set " + user.customId + " = " + user.clientId);
	// send chat log history if applied
	if(log.length != 0){
		io.to(socket.id).emit('history', log);
	}
	// broadcast user joined
	io.emit('update list', users);

	
	// client disconnect handler
	socket.on('disconnect', function(){
		console.log(socket.id + ' disconnected');
		for(var i = 0, len = users.length; i < len; ++i){
			var user = users[i];
			if(user.clientId === socket.id){
				console.log(user.customId + " removed");
				users.splice(i,1);
				// broadcast user leaved
				io.emit('update list', users);
				break; // not expected to have more than one user have the same id
			}
		}
	});
	
	// chat message handler
	socket.on('chat message', function(msg){
		if(msg != ''){
			for(var i = 0, len = users.length; i < len; ++i){
				var user = users[i];
				if(user.clientId === socket.id){
					var object = {date: new Date(), name: user.customId, message: msg, color:user.color};
					io.emit('chat message', object);
					if(log.length > 300){
						log.shift();
					}
					log.push(object);
					break; // not expected to have more than one user have the same id
				}
			}
		}
	});
	
	// user request to change nickname
	socket.on('change nickname', function(msg){
		var userId = socket.id;
		for(var i = 0, len = users.length; i < len; ++i){
			var user = users[i];
			if(user.customId === msg){
				io.to(socket.id).emit('failed change', msg + " already in used");
				return false;
			}
			if(user.clientId === socket.id){
				userId = i;
			}
		}
		if(userId === socket.id){
			console.log("!!!!Unexpected Error When Changing Nickname!!!!");
		}
		else{
			var user = users[userId];
			console.log(user.customId + " changing to be " + msg);
			user.customId = msg;
			io.to(socket.id).emit('set nickname', user.customId);
			// broadcast user changed their nickname
			io.emit('update list', users);
		}
		
	});
	
	// user request to change color
	socket.on('change color', function(msg){
		for(var i = 0, len = users.length; i < len; ++i){
			var user = users[i];
			if(user.clientId === socket.id){
				user.color = msg;
				io.to(socket.id).emit('color change', "success");
				io.emit('update list', users);
				return false;
			}
		}
		io.to(socket.id).emit('color change', "failed");
	});
});

// display message when server start
http.listen(port, function(){
	console.log('listening on *:' + port);
});
