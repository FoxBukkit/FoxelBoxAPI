'use strict';

var Promise = require('bluebird');

var Player = require('../../models/redis/player');
var Server = require('../../models/redis/server');

var playerPropNames = {
	displayName: 'Display name',
	fullName: 'Full name',
	name: 'Name',
	uuid: 'UUID',
	rank: 'Rank',
	level: 'Level'
};

module.exports = [
	{
		path: '/v2/player',
		method: 'GET',
		handler: function (request, reply) {
			reply(
				Server.getAll()
				.map(function (server) {
					return Promise.props({
						server: server.getName(),
						players: Player.getOnline(server)
						.map(function (player) {
							return Promise.props({
								uuid: player.getUUID(),
								name: player.getName(),
								displayName: player.getDisplayName()
							});
						})
					});
				})
				.then(function (result) {
					return {
						success: true,
						result: result
					};
				})
			);
		}
	},
	{
		path: '/v2/player/{uuid}',
		method: 'GET',
		handler: function (request, reply) {
			var uuid = request.params.uuid;
			if (uuid === 'myself') {
				uuid = request.auth.credentials.uuid;
			}

			var player = Player.get(uuid);

			reply(Promise.props({
				uuid: player.getUUID(),
				name: player.getName(),
				displayName: player.getDisplayName(),
				fullName: player.getFullName(),
				rank: player.getRank(),
				level: player.getLevel()
			}).then(function (props) {
				var allProps = [];
				for (var key in props) {
					allProps.push({ name: key, value: props[key], title: playerPropNames[key] });
				}
				return {
					success: true,
					result: allProps
				};
			}));
		}
	}
];
