var botAna = function botAna(options){
	this.username = options.username;
	this.password = options.password;
	this.channel = options.channel;

	this.server = 'irc-ws.chat.twitch.tv';
	this.port = 443;
}

botAna.prototype.open = function open(){
	this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');

	this.webSocket.onmessage = this.onMessage.bind(this);
	this.webSocket.onerror = this.onError.bind(this);
	this.webSocket.onclose = this.onClose.bind(this);
	this.webSocket.onopen = this.onOpen.bind(this);
};

botAna.prototype.onError = function onError(message){
	console.log('Error: ' + message);
};

botAna.prototype.onMessage = function onMessage(message){
	if(message !== null){
		var parsed = this.parseMessage(message.data);
		if(parsed !== null){
			if(parsed.command === "PRIVMSG") {
				userPoints = localStorage.getItem(parsed.username);

				if(userPoints === null){
					localStorage.setItem(parsed.username, 10);
				}
				else {
					localStorage.setItem(parsed.username, parseFloat(userPoints) + 0.25);
				}
			}
			if(parsed.message !== null){
				if(parsed.message.includes("monkaS")){
					this.webSocket.send("PRIVMSG #pinasu :" + "monkaS")
				}
			}
			else if(parsed.command === "PING") {
				this.webSocket.send("PONG :" + parsed.message);
			}
		}
		console.log(parsed)
	}
};

botAna.prototype.onOpen = function onOpen(){
	var socket = this.webSocket;

	if (socket !== null && socket.readyState === 1) {
		console.log('Connecting and authenticating...');

		socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
		socket.send('PASS ' + this.password);
		socket.send('NICK ' + this.username);
		socket.send('JOIN ' + this.channel);
	}
};

botAna.prototype.onClose = function onClose(){
	console.log('Disconnected from the chat server.');
};

botAna.prototype.close = function close(){
	if(this.webSocket){
		this.webSocket.close();
	}
};

/* This is an example of an IRC message with tags. I split it across
multiple lines for readability. The spaces at the beginning of each line are
intentional to show where each set of information is parsed. */

//@badges=global_mod/1,turbo/1;color=#0D4200;display-name=TWITCH_UserNaME;emotes=25:0-4,12-16/1902:6-10;mod=0;room-id=1337;subscriber=0;turbo=1;user-id=1337;user-type=global_mod
// :twitch_username!twitch_username@twitch_username.tmi.twitch.tv
// PRIVMSG
// #channel
// :Kappa Keepo Kappa

botAna.prototype.parseMessage = function parseMessage(rawMessage) {
	var parsedMessage = {
		message: null,
		tags: null,
		command: null,
		original: rawMessage,
		channel: null,
		username: null
	};

	if(rawMessage[0] === '@'){
		var tagIndex = rawMessage.indexOf(' '),
		userIndex = rawMessage.indexOf(' ', tagIndex + 1),
		commandIndex = rawMessage.indexOf(' ', userIndex + 1),
		channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
		messageIndex = rawMessage.indexOf(':', channelIndex + 1);

		parsedMessage.tags = rawMessage.slice(0, tagIndex);
		parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
		parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
		parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
		parsedMessage.message = rawMessage.slice(messageIndex + 1);
	} else if(rawMessage.startsWith("PING")) {
		parsedMessage.command = "PING";
		parsedMessage.message = rawMessage.split(":")[1];
	}

	return parsedMessage;
}
