'use strict';

var config = require('./config');

var Promise = require('bluebird');
var redis = require('redis');
Promise.promisifyAll(redis);

/**
 * Creates and returns a new promisified node_redis client.
 * @return {Redis} [description]
 */
function create () {
	config.redis.options.detect_buffers = true;
	var client = redis.createClient(
		config.redis.port,
		config.redis.host,
		config.redis.options
	);
	client.select(config.redis.options.database || 0);
	return client;
}

// Create and return a new "default" client.
var client = create();
client.create = create;
module.exports = client;
