'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var uuid = require('uuid');

var redis = require('../../redis');
var Player = require('../../models/redis/player');

function tryPollMessages(since, longPoll, player) {
	return redis.lrangeAsync('apiMessageCache', 0, -1).map(function (message) {
		return JSON.parse(message);
	}).filter(function (message) {
		return message.id > since;
	}).filter(function (message) {
		switch (message.to.type) {
			case 'all':
				return true;
			case 'player':
				return message.to.filter.indexOf(player.uuid) >= 0;
			case 'permission':
				return player.hasAnyPermission(message.to.filter);
			default:
				return false;
		}
	}).filter(function (message) {
		return !message.from || player.ignores(message.from.uuid).then(function (result) {
			return !result;
		});
	}).then(function (messages) {
		if (longPoll > 0 && messages.length < 1) {
			return Promise.delay(1000).then(function () {
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

			reply(player.getName().then(function (playerName) {
				return redis.lpushAsync('foxbukkit:from_server', JSON.stringify({
					server: 'Chat',
					from: {
						uuid: playerUuid,
						name: playerName
					},
					timestamp: Math.floor(Date.now() / 1000),
					context: context,
					type: 'text',
					contents: message
				}));
			}).then(function () {
				return {
					success: true,
					result: context
				};
			}));
		}
	}
];
