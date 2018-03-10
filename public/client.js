// shorthand for $(document).ready(...)
$(function() {
	var socket = io();
	var myName = "";
	
	socket.on('history', function(log){
		for(var i = 0, len = log.length; i < len; ++i){
			var message = log[i];
			var ap = '<li>';
			if(message.name === myName){
				ap = '<li id="self">';
			}
			$('#messages').append($(ap).text(new Date(message.date).toLocaleTimeString()+" "+message.name+": "+message.message));
		}
		window.scrollTo(0, document.body.scrollHeight);
	});
	
    $('form').submit(function(){
		var msg = $('#m').val();
		if(msg.startsWith("/nickcolor")){
			socket.emit('change color', msg.substring(11));
			document.cookie = "color="+msg.substring(11);
		}
		else if(msg.startsWith("/nick")){
			document.cookie = "nickname="+msg.substring(6);
			socket.emit('change nickname', msg.substring(6));
			
		}
		else{
			socket.emit('chat message', msg);
		}
		
		$('#m').val('');
		return false;
    });
    socket.on('chat message', function(list){
		var ap = '<li>';
		if(list.name === myName){
			ap = '<li id="self">';
		}
		var msg = ap+new Date(list.date).toLocaleTimeString()+" "+'<a style="color:'+list.color+'">'+list.name+"</a>"+": "+list.message+"</li>";
		$('#messages').append(msg);
		window.scrollTo(0, document.body.scrollHeight);
    });
    
    socket.on('set nickname', function(newName){
		myName = newName;
		var msg = "You are " + myName + " now.";
		$('#header').html(msg);
		$('#messages').append($('<li>').text(msg));
		
		var nickname = document.cookie.replace(/(?:(?:^|.*;\s*)nickname\s*\=\s*([^;]*).*$)|^.*$/, "$1");
		if(getCookie("nickname") != null && nickname != myName){
			console.log("going to change nickname after reconnect");
			socket.emit('change nickname', nickname);
			socket.emit('change color', document.cookie.replace(/(?:(?:^|.*;\s*)color\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
		}
	});
	
	socket.on('failed change', function(msg){
		$('#messages').append($('<li>').text("Changing nickname failed: " + msg));
	});
	
	socket.on('update list', function(users){
		$('#online').empty();
		for(var i = 0, len = users.length; i < len; ++i){
			var user = users[i].customId;
			$('#online').append('<li><a style="color:'+users[i].color+'">'+user+"</a></li>");
			
		}
	});
	
	socket.on('color change', function(msg){
		if(msg === "success"){
			$('#messages').append($('<li>').text("Changing color success, you can see it changed from the online user list."));
		}
		else{
			$('#messages').append($('<li>').text("Changing color failed, please contact admin for this error."));
		}
	});
	
	function getCookie(name) {
		var cookie = document.cookie;
		var prefix = name + "=";
		var begin = cookie.indexOf("; " + prefix);
		if (begin == -1) {
			begin = cookie.indexOf(prefix);
			if (begin != 0) return null;
		} 
		else {
			begin += 2;
			var end = document.cookie.indexOf(";", begin);
			if (end == -1) {
			end = cookie.length;
			}
		}
		return unescape(cookie.substring(begin + prefix.length, end));
	}
});

function openNav() {
	$('#sideBar').css({width: "15%", minWidth:"150px"});
}

function closeNav() {
	$('#sideBar').css({width: "0", minWidth:"0"});
}
