'use strict';

var redis = require('../../redis');

var ONLINE_KEY = 'playersOnline:Chat';
var PLAYER_KEYS = 'chatPlayerOnline:';

module.exports.refresh = function () {
	var newKey = ONLINE_KEY + ':new';
	return redis.delAsync(newKey)
	.then(function () {
		return redis.keysAsync(PLAYER_KEYS + '*');
	})
	.each(function (key) {
		return redis.saddAsync(newKey, key);
	})
	.then(function (keys) {
		if (keys.length > 0) {
			return redis.renameAsync(newKey, ONLINE_KEY);
		} else {
			return redis.delAsync(newKey, ONLINE_KEY);
		}
	});
};

module.exports.add = function (player, expiresAt) {
	if (player.uuid) {
		player = player.uuid;
	}

	return redis.setAsync(PLAYER_KEYS + player, true)
	.then(function () {
		return redis.expireAtAsync(PLAYER_KEYS + player, expiresAt);
	})
	.then(function () {
		return redis.saddAsync(ONLINE_KEY, player);
	});
};

module.exports.del = function (player) {
	if (player.uuid) {
		player = player.uuid;
	}

	return redis.delAsync(PLAYER_KEYS + player)
	.then(function () {
		return redis.sremAsync(ONLINE_KEY, player);
	});
};
