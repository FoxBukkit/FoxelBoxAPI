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
	return redis.hgetAsync('playerUUIDToName', this.uuid).bind(this).then(function (name) {
		this.name = name;
		return name;
	});
};

Player.prototype.getRank = function () {
	if (this.rank) {
		return Promise.resolve(this.rank);
	}
	return redis.hgetAsync('playergroups', this.uuid).bind(this).then(function (rank) {
		if (!rank) {
			rank = 'guest';
		}
		this.rank = rank;
		return rank;
	});
};

Player.getRankLevel = function (rank) {
	return redis.hgetAsync('ranklevels', rank).then(function (level) {
		return parseInt(level);
	});
};

Player.prototype.getLevel = function () {
	if (this.rankLevel) {
		return Promise.resolve(this.rankLevel);
	}
	return Player.getRankLevel(this.getRank()).then(function (level) {
		this.rankLevel = level;
		return level;
	});
};

Player.prototype.getDisplayName = function () {
	if(this.displayName) {
		return Promise.resolve(this.displayName);
	}
	return Promise.props({
		nick: redis.hgetAsync('playernicks', this.uuid),
		name: this.getName(),
		playerRankTag: redis.hgetAsync('playerRankTags', this.uuid),
		rankTag: this.getRank().then(function (rank) {
			return redis.hgetAsync('ranktags', rank);
		})
	}).then(function(result) {
		var nick = (result.nick && result.nick !== '') ? result.nick : result.name;
		var tag = (result.playerRankTag && result.playerRankTag !== '') ? result.playerRankTag : result.rankTag;
		if (!tag) {
			return nick;
		}
		return tag + nick;
	});
};

/*
public function ignores($uuid) {
        if(!$this->ignoreList) {
            $this->ignoreList = array();
            $redisList = explode(',', RedisL4::connection()->hget('ignoreList', $this->uuid));
            foreach($redisList AS $value) {
                $this->ignoreList[$value] = true;
            }
        }
        return isset($this->ignoreList[$uuid]);
    }
    */

Player.get = function (uuid) {
	return new Player(uuid);
};

Player.getOnline = function (server) {
	return redis.lrangeAsync('playersOnline:' + server.getName(), 0, -1).map(function(uuid) { 
		return Player.get(uuid);
	});
};

Player.getAllOnline = function () {
	var allPlayers = [];
	return Server.getAll().each(function (server) {
		return Player.getOnline(server).then(function (players) {
			allPlayers = allPlayers.concat(players);
		});
	}).then(function () {
		return allPlayers;
	});
};

module.exports = Player;