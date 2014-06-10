<?php
namespace APIv1;

class MessageController extends APIController {
    public function pollAction() {
        $this->requireLoggedIn();

        $since = (float)\Input::get('since');
        $redis = \RedisL4::connection();

        $messages = array();
        
        $found = !\Input::has('longpoll');
        $waited = 0;

        $uuid = $this->user->getUUID();

        while(true) {
            foreach($redis->lrange('apiMessageCache', 0, -1) AS $value) {
                $data = json_decode($value);
                if($data->time > $since) {
                    if($data->to->type == 'all' ||
                        ($data->to->type == 'player' && in_array($uuid, $data->to->filter)) ||
                        ($data->to->type == 'permission' && $this->user->hasPermission($data->to->filter))) {
                            $messages[] = $data;
                            $found = true;
                    }
                }
            }
            if($found || ++$waited > 20)
                break;
            sleep(1);
        }

        $time = microtime(true);

        $this->makeSuccess(array('time' => $time, 'messages' => $messages));
    }

    public function sendAction() {
        $this->requireLoggedIn();
        $redis = \RedisL4::connection();
        $uuid = $this->user->getUUID();
        $message = \Input::get('message');
        if($message{0} == "\u0123")
            $message = substr($message, 1);
        $message = str_replace("\r", '', $message);
        $message = str_replace("\n", '', $message);
        $message = str_replace("\t", '', $message);
        $redis->publish('foxbukkit:from_server', 'Chat|' . $uuid . '|' . $redis->hget('playerUUIDToName', $uuid) . '|' . $message);
        $this->makeSuccess(array('ok' => true));
    }
} 