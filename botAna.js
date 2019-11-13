const utilities = require('./utilities.js');
var request = require('request');
window.$ = window.jQuery = require('jquery');

var parsed;
var user = {
	username: null,
	color: null,
	display_name: null,
	emotes: null,
	mod: false, 			//default
	subscriber: false, 		//default
	user_id: null,
	message: null
};

var botAna = function botAna(options) {
	this.username = options.username;
	this.password = options.password;
	this.channel = options.channel;
	this.client_id = options.client_id;
	this.client_secret = options.client_secret;

	this.server = 'irc-ws.chat.twitch.tv';
	this.port = 443;
};

botAna.prototype.open = function open() {
	this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');

	this.webSocket.onmessage = this.onMessage.bind(this);
	this.webSocket.onerror = this.onError.bind(this);
	this.webSocket.onclose = this.onClose.bind(this);
	this.webSocket.onopen = this.onOpen.bind(this);

	/*
	var json_emotes = this.getTwitchEmotes();
	if(json_emotes !== null){
		console.log(json_emotes);
	}
	else {
		console.log("NULL");
	}
	*/
};

botAna.prototype.onReady = function onReady(){
	$("#input-frm").on("submit", function(e){
		e.preventDefault();
		
	})
}
botAna.prototype.onError = function onError(message) {
	console.log('Error: ' + message);
};

botAna.prototype.onMessage = function onMessage(message) {
	if (message !== null) {
		parsed = this.parseMessage(message.data);
		if (parsed !== null) {
			if (parsed.command === "PING") {
				this.webSocket.send("PONG :" + parsed.message);
				console.log("["+utilities.get_current_time()+"] Received PING from twitch.tv, sent PONG")
			} else {
				if (parsed.message !== null) {
					if (parsed.username.includes("NOTICE")) {
						console.log("["+utilities.get_current_time()+"] Received a NOTICE from twitch.tv");
					} else {
						if (!(parsed.message.includes("GLOBALUSERSTATE")) && !(parsed.message.includes("USERSTATE")) && !(parsed.message.includes("ROOMSTATE"))) {
							user["username"] = parsed.username;
							user["message"] = parsed.message;

							this.parseInfos(parsed.tags);
							console.log(parsed.tags);

							$("#message-window").append("<div><span class=message_time>" + utilities.get_current_time() + "</span> <strong><span style=color:"+user["color"]+">" + user["username"] + "</strong></span>: " + parsed["message"] + "</div>");
							utilities.scroll_to_bottom();
						}
						/*	First command, this is staying here for ever	*/
						if (parsed.message.includes("monkaS")) {
							this.sendMessage("monkaS")
						}
					}
				}
			}
		}
		utilities.scroll_to_bottom();
	}
};

botAna.prototype.onOpen = function onOpen() {
	var socket = this.webSocket;

	if (socket !== null && socket.readyState === 1) {
		socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
		socket.send('PASS ' + this.password);
		socket.send('NICK ' + this.username);
		socket.send('JOIN ' + this.channel);

		//this.sendMessage("Don't even worry guys, I'm here HeyGuys")
	}
};

botAna.prototype.sendMessage = function sendMessage(message) {
	this.webSocket.send("PRIVMSG " + this.channel + " :" + message)
	$("#message_window").append("<div><span class=message_time>" + utilities.get_current_time() + "</span> <span style=color:#0000ff;><strong>" + this.username + "</strong></span>: " + message + "</div>");
};

botAna.prototype.parseInfos = function parseInfos(tags) {
	//@badges=global_mod/1,turbo/1;
	//color=#0D4200;
	//display-name=TWITCH_UserNaME;
	//emotes=25:0-4,12-16/1902:6-10;
	//mod=0;
	//room-id=1337;
	//subscriber=0;
	//turbo=1;
	//user-id=1337;
	//user-type=global_mod
	var infos = tags.split(';');
	user["color"] = infos[2].split('=')[1]
	user["mod"] = infos[7].split('=')[1]
	user["subscriber"] = infos[9].split('=')[1]
	user["user_id"] = infos[12].split('=')[1]
};

botAna.prototype.onClose = function onClose() {
	console.log('Disconnected from the chat server.');
};

botAna.prototype.close = function close() {
	if (this.webSocket)
		this.webSocket.close();
};

botAna.prototype.parseMessage = function parseMessage(rawMessage) {
	var parsedMessage = {
		message: null,
		tags: null,
		command: null,
		original: rawMessage,
		channel: null,
		username: null
	};

	if (rawMessage[0] === '@') {
		var tagIndex = rawMessage.indexOf(' '),
			userIndex = rawMessage.indexOf(' ', tagIndex + 1),
			commandIndex = rawMessage.indexOf(' ', userIndex + 1),
			channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
			messageIndex = rawMessage.indexOf(':', channelIndex + 1);

		parsedMessage.tags = rawMessage.slice(0, tagIndex);
		parsedMessage.tags.split(';');

		parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
		parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
		parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
		parsedMessage.message = rawMessage.slice(messageIndex + 1);
	} else if (rawMessage.startsWith("PING")) {
		parsedMessage.command = "PING";
		parsedMessage.message = rawMessage.split(":")[1];
	}
	return parsedMessage;
};

botAna.prototype.getTwitchEmotes = function getTwitchEmotes(){
	/*const Http = new XMLHttpRequest();
	const url='https://api.twitch.tv/kraken/chat/emoticons';
	Http.open("GET", url, false);
	Http.setRequestHeader('Client-ID', this.client_id);
	Http.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json')
	Http.setRequestHeader('Content-Type', 'application/json')
	Http.send();

	console.log('Twitch emotes retrieved.');
	console.log(JSON.parse(Http.responseText));*/

	var options = {
		method: 'GET',
		//rejectUnauthorized: false,
		url: "https://api.twitch.tv/kraken/chat/emoticons",
		headers: {
			"Client-ID": this.client_id,
			"Content-Type": "application/json",
			"Accept": "application/vnd.twitchtv.v5+json"
		}
	};
	var r = request(options, function(error, response, body){
		if(response.statusCode === 200){

			console.log(JSON.parse(body));
			return JSON.parse(body);
		}
		else {
			console.log("O SHIET")
		}
	});
	return null;
}
