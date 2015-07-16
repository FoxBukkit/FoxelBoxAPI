'use strict';

var zmq = require('zmq');
var redis = require('./redis');
var config = require('./config');
var util = require('./util');
var UserTracker = require('./models/redis/usertracker');
var proto = require('./proto');

function trySubscribe () {
	console.log('[SUBSCRIBE]', 'start');

	var zmqSocket = zmq.socket('sub');
	util.loadZMQConfig(config.zeromq.brokerToServer, zmqSocket);

	zmqSocket.on('message', function (topic, messageProto) {
		var messageDecoded;
		try {
			messageDecoded = proto.ChatMessageOut.decode(messageProto);
		} catch(error) {
			console.error('[SUBSCRIBE]', error, error.stack);
			return;
		}
		var message = {
			server: messageDecoded.server,
			from: {
				uuid: messageDecoded.from_uuid,
				name: messageDecoded.from_name
			},
			to: {
				type: proto.TargetTypeLookup[messageDecoded.to_type].toLowerCase(),
				filter: messageDecoded.to_filter
			},
			id: messageDecoded.id.toNumber(),
			timestamp: messageDecoded.timestamp.toNumber(),
			context: messageDecoded.context,
			finalizeContext: messageDecoded.finalizeContext,
			type: proto.MessageTypeLookup[messageDecoded.type].toLowerCase(),
			contents: messageDecoded.contents
		};
		redis.lpushAsync('apiMessageCache', JSON.stringify(message)).catch(function (error) {
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
