'use strict';

var Promise = require('bluebird');
var Joi = require('joi');

var Player = require('../../models/redis/player.js');
var sequelize = require('../../models/forum');

var ForumUser = sequelize.User;

var playerPropNames = {
    displayName: 'Display name',
    fullName: 'Full name',
    name: 'Name',
    uuid: 'UUID',
    rank: 'Rank',
    level: 'Level',
};

module.exports = [
    {
        path: '/v2/player',
        method: 'GET',
        handler: function (request, reply) {
            reply(Player.getAllOnline().map(function (player) {
                return Promise.props({
                    uuid: player.getUUID(),
                    name: player.getName(),
                    displayName: player.getDisplayName()
                });
            }).then(function (result) {
                return {
                    success: true,
                    result: result
                };
            }));
        }
    },
    {
        path: '/v2/player/{uuid}',
        method: 'GET',
        handler: function (request, reply) {
            var uuidParam = request.params.uuid;
            var uuidPromise;
            if (uuidParam === 'myself') {
                uuidPromise = ForumUser.findOne({ user_id: request.auth.credentials.userId }).then(function (user) {
                    return user.extendWithUUID();
                }).then(function (user) {
                    return user.uuid;
                });
            } else {
                uuidPromise = Promise.resolve(uuidParam);
            }

            var allProps = [];

            reply(uuidPromise.then(function (uuid) {
                return Player.get(uuid);
            }).then(function (player) {
                return Promise.props({
                    uuid: player.getUUID(),
                    name: player.getName(),
                    displayName: player.getDisplayName(),
                    fullName: player.getFullName(),
                    rank: player.getRank(),
                    level: player.getLevel()
                });
            }).then(function (props) {
                var allProps = [];
                for(var key in props) {
                    allProps.push({ name: key, value: props[key], title: playerPropNames[key] });
                }
                return {
                    success: true,
                    result: allProps
                };
            }));
        }
    },
];
/*
    public function infoAction() {
        $this->requireLoggedIn();
        $uuid = \Input::get('uuid');
        if($uuid == 'myself')
            $uuid = $this->user->getUUID();
        $user = new \MCUser($uuid);
        $this->makeSuccess(array('fields' => array(
            array('title' => 'Pretty name', 'name' => 'display_name', 'value' => $user->getFullNickAndTag()),
            array('title' => 'Name', 'name' => 'name', 'value' => $user->getName()),
            array('title' => 'Rank', 'name' => 'rank', 'value' => $user->getRank()),
            array('title' => 'Level', 'name' => 'level', 'value' => $user->getLevel()),
        )));
    }
*/
