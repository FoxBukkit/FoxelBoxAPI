'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var uuid = require('uuid');

var redis = require('../../redis');
var Player = require('../../models/redis/player');

module.exports = [
    {
        path: '/v2/message',
        method: 'GET',
        handler: function (request, reply) {
            var since = request.query.since || 0;
            var longPoll = request.query.longPoll || false;

            reply({
                success: true,
                result: {
                    time: 0,
                    messages: []
                }
            });
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
                    timestamp: (((new Date()).getTime()) / 1000) | 0,
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