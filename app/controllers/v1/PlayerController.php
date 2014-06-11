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
            $ret[$server] = $list;
        }
    }

    public function infoAction() {
        $this->requireLoggedIn();
        $uuid = \Input::get('uuid');
        if($uuid == 'myself')
            $uuid = $this->user->getUUID();
        $user = new \MCUser($uuid);
        $this->makeSuccess(array(
            'Pretty name' => $user->getFullNickAndTag(),
            'Name' => $user->getName(),
            'Rank' => $user->getRank(),
            'Level' => $user->getLevel(),
        ));
    }
} 