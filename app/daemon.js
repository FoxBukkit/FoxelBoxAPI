'use strict';

var redis = require('./redis');

function trySubscribe() {
	var subscribeRedis = redis.create();
	subscribeRedis.on('message', function (channel, message) {
		redis.lpushAsync('apiMessageCache', message).catch(function (error) {
			console.error(error, error.stack);
		});
	});
	subscribeRedis.on('error', function () {
		setTimeout(trySubscribe, 1000);
	});
	subscribeRedis.subscribe('foxbukkit:to_server');
}

function removeOldMessages () {
	var minimalTime = Math.floor(Date.now() / 1000) - 60;
	redis.lrangeAsync('apiMessageCache', 50, -1)
	.filter(function (entry) {
		return JSON.parse(entry).timestamp < minimalTime;
	})
	.each(function (entry) {
		return redis.lremAsync('apiMessageCache', 1, entry);
	})
	.catch(function (error) {
		console.error(error, error.stack);
	})
	.delay(30000)
	.then(removeOldMessages);
}

trySubscribe();
removeOldMessages();
