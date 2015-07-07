'use strict';

global.rekuire = require('rekuire');

var Hapi = require('hapi');
// jshint: -Promise
var Promise = require('bluebird');

var server = new Hapi.Server();

Promise.promisifyAll(server);

server.connection({
	port: process.env.PORT || 3000
});

server.ext('onPreResponse', function(request, next) {
	if (request.response instanceof Error) {
		var response = request.response;
		console.error(response.stack);
	}
	next(request.response);
});

server.registerAsync({
	register: require('hapi-router'),
	options: {
		routes: 'app/routes/**/*.js'
	}
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



