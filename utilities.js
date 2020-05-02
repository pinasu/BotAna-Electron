module.exports = {
	get_current_time: function(msg_ts) {
		var msg_ts = parseInt(msg_ts);

		if(!isNaN(msg_ts)){
			var d = new Date(msg_ts);
			
			h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
				m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
			return h + ':' + m;
		}
	},

	scroll_to_bottom: function() {
		//get container element
		var container = $("#message_window");
		//scroll down
		container.scrollTop = container.scrollHeight;
  }
};
