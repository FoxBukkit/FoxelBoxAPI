'use strict';
var redis = require('../../redis');

function Server (name) {
	this.name = name;
}

Server.prototype.getName = function () {
	return this.name;
};

Server.getAll = function () {
	return redis.zrangeAsync('activeServers', 0, -1)
	.map(function(server) {
		return new Server(server);
	});
};

module.exports = Server;
