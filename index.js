var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: process.env.PORT || 3000 });

require('./controllers/v1')(function(obj) {
	obj.path = '/v1/' + obj.path;
	return server.route(obj);
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});