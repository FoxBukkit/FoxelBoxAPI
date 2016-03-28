'use strict';

var zmq = require('zmq');
var redis = require('./redis');
var config = require('./config');
var util = require('./util');
var proto = require('./proto');
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
		redis.zaddAsync('apiMessageCache', decoded.id.toString(), messageProto).catch(function (error) {
			console.error('[SUBSCRIBE]', error, error.stack);
		});
	});

	zmqSocket.subscribe('CMO');
}

function removeOldMessages () {
	// TODO: Bias to weed out non-ALL messages always after 60 seconds and public chat always past 100 msgs

	console.log('[REMOVEOLD]', 'start');
	var minimalTime = util.getUnixTime() - 60;
	redis.zrevrangeAsync(new Buffer('apiMessageCache'), 500, -1)
	.filter(function (entry) {
		return proto.ChatMessageOut.decode(entry).timestamp.lessThan(minimalTime);
	})
	.each(function (entry) {
		return redis.zremAsync('apiMessageCache', entry);
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
