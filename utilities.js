module.exports = {
	get_current_time: function() {
		var d = new Date();
		h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
			m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
		return h + ':' + m;
	},

	scroll_to_bottom: function() {
		//get container element
		var container = $("#message_window");
		//scroll down
		container.scrollTop = container.scrollHeight;
  }
};
