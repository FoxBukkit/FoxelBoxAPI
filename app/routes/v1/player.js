'use strict';

var Promise = require('bluebird');

var Player = require('../../models/redis/player.js');

module.exports = [
    {
        path: '/v1/player/list',
        method: ['GET', 'POST'],
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
                    list: result
                };
            }));
        }
    }
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
