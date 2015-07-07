module.exports = {
	actions: [
		{
			name: 'auth',
			method: 'POST',
			run: function(request, reply) {
				var username = request.params.username;
				var password = request.params.password;
			}
		}
	]
};