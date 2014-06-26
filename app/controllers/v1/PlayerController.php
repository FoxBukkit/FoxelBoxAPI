<?php
namespace APIv1;

class PlayerController extends APIController {
    public function listAction() {
        $this->requireLoggedIn();
        $ret = array();
        $redis = \RedisL4::connection();
        foreach($redis->lrange('activeServers', 0, -1) AS $server) {
            $list = array();
            foreach($redis->lrange('playersOnline:' . $server, 0, -1) AS $uuid) {
                $user = new \MCUser($uuid);
                $list[] = array(
                    'uuid' => $uuid,
                    'name' => $user->getName(),
                    'display_name' => $user->getFullNick(),
                );
            }
            $ret[] = array('server' => $server, 'players' => $list);
        }
        $this->makeSuccess(array('list' => $ret));
    }

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
} 