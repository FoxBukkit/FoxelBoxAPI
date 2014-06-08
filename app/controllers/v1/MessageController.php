<?php
namespace APIv1;

class MessageController extends APIController {
    public function pollAction() {
        $this->requireLoggedIn();
    }

    public function sendAction() {
        $this->requireLoggedIn();
        $redis = \Redis::connection();
        $uuid = $this->user->getUUID();
        $redis->publish('foxbukkit:from_server', 'Chat|' . $uuid . '|' . $redis->hget('playerUUIDToName', $uuid) . '|' . \Input::get('message'));
        $this->makeSuccess(array('ok' => true));
    }
} 