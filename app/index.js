'use strict';

var Hapi = require('hapi');
// jshint: -Promise
var Promise = require('bluebird');
var config = require('./config');

var server = new Hapi.Server();

Promise.promisifyAll(server);

server.connection({
	port: config.port
});

server.ext('onPreResponse', function (request, reply) {
	var response = request.response;
	if (response instanceof Error &&
		(!response.output || !response.output.statusCode || response.output.statusCode === 500)) {
		console.error(responsestack);
	}
	return reply.continue();
});

server.registerAsync({
	register: require('hapi-auth-jwt2')
}).then(function() {
	server.auth.strategy('jwt', 'jwt', true, {
		key: config.jsonWebTokenSecret,
		validateFunc: function(decoded, request, callback) {
			return callback(null, !!decoded.userId);
		}
	});

	return server.registerAsync({
		register: require('hapi-router'),
		options: {
			routes: 'app/routes/**/*.js'
		}
	});
})
.then(function() {
	return server.startAsync();
})
.then(function() {
    console.log('Server running at:', server.info.uri);
})
.catch(function(error)  {
	console.error(error);
});
