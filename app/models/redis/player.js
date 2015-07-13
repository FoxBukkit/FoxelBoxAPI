'use strict';
var Promise = require('bluebird');

var redis = require('../../redis');
var Server = require('./server');

function Player (uuid) {
	this.uuid = uuid;
}

Player.prototype.getUUID = function () {
	return this.uuid;
};

Player.prototype.getName  = function () {
	if (this.name) {
		return Promise.resolve(this.name);
	}
	return redis.hgetAsync('playerUUIDToName', this.uuid)
	.bind(this)
	.then(function (name) {
		this.name = name;
		return name;
	});
};

Player.prototype.getRank = function () {
	if (this.rank) {
		return Promise.resolve(this.rank);
	}
	return redis.hgetAsync('playergroups', this.uuid)
	.bind(this)
	.then(function (rank) {
		rank = rank || 'guest';
		this.rank = rank;
		return rank;
	});
};

Player.getRankLevel = function (rank) {
	if (rank && rank.then) {
		return rank.then(Player.getRankLevel);
	}
	return redis.hgetAsync('ranklevels', rank)
	.then(parseInt);
};

Player.prototype.getLevel = function () {
	if (this.rankLevel) {
		return Promise.resolve(this.rankLevel);
	}
	return Player.getRankLevel(this.getRank())
	.bind(this)
	.then(function (level) {
		this.rankLevel = level;
		return level;
	});
};

Player.prototype.getFullName = function () {
	if (this.fullName) {
		return Promise.resolve(this.fullName);
	}
	return Promise.props({
		displayName: this.getDisplayName(),
		tag: redis.hgetAsync('playerTags', this.uuid)
	})
	.bind(this)
	.then(function (result) {
		if (result.tag) {
			this.fullName = result.tag + ' ' + result.displayName;
		} else {
			this.fullName = result.displayName;
		}
		return this.fullName;
	});
};

Player.prototype.getDisplayName = function () {
	if (this.displayName) {
		return Promise.resolve(this.displayName);
	}
	return Promise.props({
		nick:			redis.hgetAsync('playernicks', this.uuid),
		name:			this.getName(),
		playerRankTag:	redis.hgetAsync('playerRankTags', this.uuid),
		rankTag:		this.getRank()
						.then(function (rank) {
							return redis.hgetAsync('ranktags', rank);
						})
	})
	.bind(this)
	.then(function (result) {
		var nick = result.nick || result.name;
		var tag = result.playerRankTag || result.rankTag;
		if (!tag) {
			return nick;
		}
		this.displayName = tag + nick;
		return this.displayName;
	});
};

Player.prototype.hasPermission = function (permission) {
	if (permission === 'foxbukkit.opchat') {
		return Promise.all([
			this.getLevel(),
			Player.getRankLevel('trainee')
		])
		.spread(function (myLevel, opLevel) {
			return myLevel >= opLevel;
		});
	}
	return Promise.resolve(false);
};

Player.prototype.hasAnyPermission = function (permissions) {
	var self = this;
	return Promise.reduce(permissions, function (hasAny, permission) {
		return self.hasPermission(permission)
		.then(function (hasCurrent) {
			return hasAny || hasCurrent;
		});
	}, false);
};

Player.prototype.ignores = function (uuid) {
	if (!this.ignoreList) {
		var ignoreList = [];
		return redis.hgetAsync('ignoreList', this.uuid)
		.bind(this)
		.then(function (ignores) {
			if (ignores) {
				ignores.split(',').forEach(function (ignore) {
					ignoreList[ignore] = true;
				});
			}
			this.ignoreList = ignoreList;
			return this.ignores(uuid);
		});
	}
	return Promise.resolve(this.ignoreList[uuid]);
};

Player.get = function (uuid) {
	return new Player(uuid);
};

Player.getOnline = function (server) {
	return redis.smembersAsync('playersOnline:' + server.getName())
	.map(Player.get);
};

Player.getAllOnline = function () {
	return Server.getAll()
	.reduce(function (all, server) {
		return Player.getOnline(server)
		.then(function (players) {
			return all.concat(players);
		});
	}, []);
};

module.exports = Player;
