'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var uuid = require('uuid');

var config = require('../../config');
var util = require('../../util');
var redis = require('../../redis');
var proto = require('../../proto');
var Player = require('../../models/redis/player');

var decodeOut = proto.ChatMessageOut.decode.bind(proto.ChatMessageOut);

var zmq = require('zmq');
var zmqSocket = zmq.socket('push');
util.loadZMQConfig(config.zeromq.serverToBroker, zmqSocket);

function tryPollMessages(since, longPoll, player) {
	return redis.lrangeAsync(new Buffer('apiMessageCache'), 0, -1)
	.map(decodeOut)
	.filter(function (message) {
		return message.id.greaterThan(since);
	})
	.filter(function (message) {
		switch (message.to_type) {
			case proto.TargetType.ALL:
				return true;
			case proto.TargetType.PLAYER:
				return message.to_filter.indexOf(player.uuid) >= 0;
			case proto.TargetType.PERMISSION:
				return player.hasAnyPermission(message.to_filter);
			default:
				return false;
		}
	})
	.filter(function (message) {
		return !message.from_uuid || player.ignores(message.from_uuid)
		.then(function (result) {
			return !result;
		});
	})
	.map(function (messageDecoded) {
		return {
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
	})
	.then(function (messages) {
		if (longPoll > 0 && messages.length < 1) {
			return Promise.delay(1000)
			.then(function () {
				return tryPollMessages(since, longPoll - 1, player);
			});
		}
		return {
			success: true,
			result: messages
		};
	});
}

module.exports = [
	{
		path: '/v2/message',
		method: 'GET',
		handler: function (request, reply) {
			var since = request.query.since || -1;
			var longPoll = request.query.longPoll ? 20 : 0;
			var playerUuid = request.auth.credentials.uuid;

			reply(tryPollMessages(since, longPoll, Player.get(playerUuid)));
		}
	},
	{
		path: '/v2/message',
		method: 'POST',
		config: {
			validate: {
				payload: {
					message: Joi.string().required()
				}
			}
		},
		handler: function (request, reply) {
			var playerUuid = request.auth.credentials.uuid;
			var message = request.payload.message;
			var context = uuid.v4();
			var player = Player.get(playerUuid);

			reply(
				player.getName()
				.then(function (playerName) {
					zmqSocket.send((new proto.ChatMessageIn({
						server: 'Chat',
						from_uuid: playerUuid,
						from_name: playerName,
						timestamp: util.getUnixTime(),
						context: context,
						type: proto.MessageType.TEXT,
						contents: message
					})).encode().toBuffer());
				})
				.then(function () {
					return {
						success: true,
						result: context
					};
				})
			);
		}
	}
];
