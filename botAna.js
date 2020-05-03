const utilities = require('./utilities.js');
var request = require('request');
window.$ = window.jQuery = require('jquery');

var parsed;
var user = {
	username: 		null,
	color: 			null,
	display_name: 	null,
	emotes: 		null,
	mod: 			null, 	
	subscriber: 	null, 
	user_id: 		null,
	message: 		null,
	msg_ts: 		null,
	broadcaster:    null
};

var botAna = function botAna(options) {
	this.username 			= options.username;
	this.display_username 	= options.display_username;
	this.password 			= options.password;
	this.channel 			= options.channel;
	this.client_id 			= options.client_id;
	this.client_secret 		= options.client_secret;

	this.server = 'irc-ws.chat.twitch.tv';
	this.port = 443;
};

botAna.prototype.open = function open() {
	this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');

	this.webSocket.onmessage 	= this.onMessage.bind(this);
	this.webSocket.onError 		= this.onError.bind(this);
	this.webSocket.onclose 		= this.onClose.bind(this);
	this.webSocket.onopen 		= this.onOpen.bind(this);

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
	console.error('Error: ' + message);
};

botAna.prototype.onMessage = function onMessage(message) {
	if (message !== null) {
		parsed = this.parseMessage(message.data);
		if (parsed !== null) {
			if (parsed.command === "PING") {
				this.webSocket.send("PONG :" + parsed.message);
				console.warn("["+utilities.get_current_time(new Date().getTime())+"] Received PING from twitch.tv, sent PONG")
			} else {
				if (parsed.message !== null) {
					if (parsed.username.includes("NOTICE")) {
						console.warn("["+utilities.get_current_time(new Date().getTime())+"] Received a NOTICE from twitch.tv");
					} else {
						if (!(parsed.message.includes("GLOBALUSERSTATE")) && !(parsed.message.includes("USERSTATE")) && !(parsed.message.includes("ROOMSTATE"))) {
							user["username"] 	= parsed.username;
							user["message"] 	= parsed.message;

							this.parseInfos(parsed.tags);

							var badgesList = [];

							if(user["mod"] == "1"){
								badgesList.push("mod");
							}

							if(user["subscriber"] == "1"){
								badgesList.push("sub");
							}

							if(user["broadcaster"] == "1"){
								badgesList.push("broadcaster");
							}

							$("#message-window").append(this.getMessageBadges(badgesList));

							utilities.scroll_to_bottom();
						}
						/*	First command, this is staying here for ever	*/
						if (parsed.message.includes("monkaS")) {
							this.sendMessage("monkaS");
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
	$("#message-window").append("<div><span class=message_time>" + utilities.get_current_time(new Date().getTime()) + "</span><img src='res/images/twitch/badges/badge_botana.png'><strong><span style=color:rgb(0,0,255)>" + this.display_username + "</strong></span>: " + message + "</div>");
};

botAna.prototype.parseInfos = function parseInfos(tags) {
	//[0]	@badge-info=;
	//[1]	badges=moderator/1;
	//[2]	color=#FF4500;
	//[3]	display-name=Zizory;
	//[4]	emotes=;
	//[5]	flags=;
	//[6]	id=2a42fc63-e61b-4e9c-ac9d-290ff9b2356f;
	//[7]	mod=1;
	//[8]	room-id=133174210;
	//[9]	subscriber=0;
	//[10]	tmi-sent-ts=1588414230657;
	//[11]	turbo=0;
	//[12]	user-id=119261099;
	//[13]	user-type=mod

	var infos 				= tags.split(';');
	user["color"] 			= infos[2].split('=')[1];
	user["username"] 		= infos[3].split('=')[1];
	user["mod"] 			= infos[7].split('=')[1];
	user["subscriber"] 		= infos[9].split('=')[1];
	user["msg_ts"]			= infos[10].split('=')[1];
	user["user_id"] 		= infos[12].split('=')[1];

	var badges = infos[1].split('=')[1];
	if(badges.includes("broadcaster/1")){
		user["broadcaster"] = "1";
	}
	else {
		user["broadcaster"] = "0";
	}
};

botAna.prototype.onClose = function onClose() {
	console.log('Disconnected from the chat server.');
};

botAna.prototype.close = function close() {
	if (this.webSocket){
		this.webSocket.close();
	}
};

botAna.prototype.parseMessage = function parseMessage(rawMessage) {
	var parsedMessage = {
		message: 	null,
		tags: 		null,
		command: 	null,
		original: 	rawMessage,
		channel: 	null,
		username: 	null
	};

	if (rawMessage[0] === '@') {
		var tagIndex 		= rawMessage.indexOf(' '),
			userIndex 		= rawMessage.indexOf(' ', tagIndex + 1),
			commandIndex 	= rawMessage.indexOf(' ', userIndex + 1),
			channelIndex 	= rawMessage.indexOf(' ', commandIndex + 1),
			messageIndex 	= rawMessage.indexOf(':', channelIndex + 1);

		parsedMessage.tags = rawMessage.slice(0, tagIndex);
		parsedMessage.tags.split(';');

		parsedMessage.username 	= rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
		parsedMessage.command 	= rawMessage.slice(userIndex + 1, commandIndex);
		parsedMessage.channel 	= rawMessage.slice(commandIndex + 1, channelIndex);
		parsedMessage.message 	= rawMessage.slice(messageIndex + 1);
	} 
	else if (rawMessage.startsWith("PING")) {
		parsedMessage.command 	= "PING";
		parsedMessage.message 	= rawMessage.split(":")[1];
	}
	return parsedMessage;
};

botAna.prototype.getMessageBadges = function getMessageBadges(badgesList){
	var ret = "<div><span class=message_time>" + utilities.get_current_time(user["msg_ts"]) + "</span>";

	for(var i=0; i<badgesList.length; i++){
		if(badgesList[i] == "mod"){
			ret += "<img src='res/images/twitch/badges/mod_sword.png'>";
		}
		if(badgesList[i] == "broadcaster"){
			ret += "<img src='res/images/twitch/badges/broadcaster.png'>";
		}
		if(badgesList[i] == "sub"){
			ret += "<img src='res/images/twitch/badges/sub_badge.png>";
		}
	}
	return ret += "<strong><span style='color:"+user["color"]+"''>" + user["username"] + "</strong></span>: " + parsed["message"] +"</div>";
}

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
