'use strict';

var zmq = require('zmq');
var redis = require('./redis');
var config = require('./config');
var util = require('./util');
var UserTracker = require('./models/redis/usertracker');

var forwardedMessageTypes = {};
forwardedMessageTypes[proto.MessageType.BLANK] = true;
forwardedMessageTypes[proto.MessageType.TEXT] = true;

function trySubscribe () {
	console.log('[SUBSCRIBE]', 'start');

	var zmqSocket = zmq.socket('sub');
	util.loadZMQConfig(config.zeromq.brokerToServer, zmqSocket);

	zmqSocket.on('message', function (topic, messageProto) {
		var decoded = proto.ChatMessageOut.decode(messageProto);
		if (!forwardedMessageTypes[decoded.type]) {
			return;
		}
		redis.lpushAsync('apiMessageCache', decoded.id.toString(36) + '|' + messageProto).catch(function (error) {
			console.error('[SUBSCRIBE]', error, error.stack);
		});
	});

	zmqSocket.subscribe('CMO');
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
