'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var uuid = require('uuid');

var config = require('../../config');
var util = require('../../util');
var redis = require('../../redis');
var proto = require('../../proto');
var Player = require('../../models/redis/player');

var zmq = require('zmq');
var zmqSocket = zmq.socket('push');
util.loadZMQConfig(config.zeromq.serverToBroker, zmqSocket);

var protoDecodeChatMessageOut = proto.ChatMessageOut.decode.bind(proto.ChatMessageOut);

var apiMessageCacheBuffer = new Buffer('apiMessageCache');
var posInfinity = new Buffer('+inf');

function tryPollMessages(since, longPoll, player) {
	var latestId = null;
	return redis.zrangebyscoreAsync(apiMessageCacheBuffer, since + 1, posInfinity)
	.map(protoDecodeChatMessageOut)
	.each(function (message) {
		if (!latestId || message.id.greaterThan(latestId)) {
			latestId = message.id;
		}
	})
	.filter(function (message) {
		var targetType = message.to ? message.to.type : proto.TargetType.ALL;
		switch (targetType) {
			case proto.TargetType.ALL:
				return true;
			case proto.TargetType.PLAYER:
				return player && message.to.filter.indexOf(player.uuid) >= 0;
			case proto.TargetType.PERMISSION:
				return player && player.hasAnyPermission(message.to.filter);
			default:
				return false;
		}
	})
	.filter(function (message) {
		if (!message.from) {
			return true;
		}
		message.from.uuid = util.loadProtobufUUID(message.from.uuid);
		if (!player) {
			return true;
		}
 		return player.ignores(message.from.uuid)
		.then(function (result) {
			return !result;
		});
	})
	.map(function (messageDecoded) {
		return {
			server: messageDecoded.server,
			from: {
				uuid: messageDecoded.from ? messageDecoded.from.uuid : null,
				name: messageDecoded.from ? messageDecoded.from.name : null
			},
			to: {
				type: messageDecoded.to ? proto.TargetTypeLookup[messageDecoded.to.type].toLowerCase() : 'all',
				filter: messageDecoded.to ? messageDecoded.to.filter : []
			},
			id: messageDecoded.id.toNumber(),
			timestamp: messageDecoded.timestamp.toNumber(),
			context: util.loadProtobufUUID(messageDecoded.context),
			finalizeContext: messageDecoded.finalizeContext,
			type: proto.MessageTypeLookup[messageDecoded.type].toLowerCase(),
			contents: messageDecoded.contents
		};
	})
	.then(function (messages) {
		if (longPoll > 0 && !latestId) {
			return Promise.delay(1000)
			.then(function () {
				return tryPollMessages(since, longPoll - 1, player);
			});
		}
		return {
			success: true,
			result: {
				latestId: latestId ? latestId.toNumber() : -1,
				messages: messages
			}
		};
	});
}

module.exports = [
	{
		path: '/v2/message',
		method: 'GET',
		config: {
			auth: {
				mode: 'optional'
			}
		},
		handler: function (request, reply) {
			var since = parseInt(request.query.since) || -1;
			var longPoll = request.query.longPoll ? 20 : 0;
			var player = null;
			if (request.auth && request.auth.credentials && request.auth.credentials.uuid) {
				player = new Player(request.auth.credentials.uuid);
			}

			reply(tryPollMessages(since, longPoll, player));
		}
	},
	{
		path: '/v2/message',
		method: 'POST',
		config: {
			validate: {
				payload: {
					message: Joi.string().max(240).required()
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
						from: {
							uuid: util.writeProtobufUUID(playerUuid),
							name: playerName
						},
						timestamp: util.getUnixTime(),
						context: util.writeProtobufUUID(context),
						type: proto.MessageType.TEXT,
						contents: message
					})).encode().toBuffer());
				})
				.then(function () {
					return {
						success: true,
						result: {
							context: context
						}
					};
				})
			);
		}
	}
];
