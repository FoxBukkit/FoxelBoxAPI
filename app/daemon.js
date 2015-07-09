'use strict';

var redis = require('./redis');
var util = require('./util');
var UserTracker = require('./models/redis/usertracker');

function trySubscribe() {
	console.log('[SUBSCRIBE]', 'start');
	var subscribeRedis = redis.create();
	subscribeRedis.on('message', function (channel, message) {
		redis.lpushAsync('apiMessageCache', message).catch(function (error) {
			console.error('[SUBSCRIBE]', error, error.stack);
		});
	});
	subscribeRedis.on('error', function (error) {
		console.error('[SUBSCRIBE]', error, error.stack);
		setTimeout(trySubscribe, 1000);
	});
	subscribeRedis.subscribe('foxbukkit:to_server');
}

function removeOldMessages () {
	console.log('[REMOVEOLD]', 'start');
	var minimalTime = util.getUnixTime() - 60;
	redis.lrangeAsync('apiMessageCache', 50, -1)
	.filter(function (entry) {
		return JSON.parse(entry).timestamp < minimalTime;
	})
	.each(function (entry) {
		return redis.lremAsync('apiMessageCache', 1, entry);
	})
	.catch(function (error) {
		console.error('[REMOVEOLD]', error, error.stack);
	})
	.then(function () {
		console.log('[REMOVEOLD]', 'done');
	})
	.delay(30000)
	.then(removeOldMessages);
}

function refreshUserTracker () {
	console.log('[RENEWUSER]', 'start');
	UserTracker.refresh()
	.catch(function (error) {
		console.error('[RENEWUSER]', error, error.stack);
	})
	.then(function () {
		console.log('[RENEWUSER]', 'done');
	})
	.delay(30000)
	.then(refreshUserTracker);
}

trySubscribe();
removeOldMessages();
refreshUserTracker();
