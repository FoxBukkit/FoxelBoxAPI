<?php
namespace APIv1;

class MessageController extends APIController {
    public function pollAction() {
        $this->requireLoggedIn();

        $since = \Input::get('since');
        $redis = \RedisL4::connection();

        $messages = array();
        
        $found = !\Input::has('longpoll');
        $waited = 0;

        $uuid = $this->user->getUUID();
        $mcUser = $this->user->getMCUser();

        $maxTime = $since;

        while(true) {
            foreach($redis->lrange('apiMessageCache', 0, -1) AS $value) {
                $data = json_decode($value);
                if($data->time > $since) {
                    if(
                        (
                            $data->to->type == 'all' ||
                            ($data->to->type == 'player' && in_array($uuid, $data->to->filter)) ||
                            ($data->to->type == 'permission' && $mcUser->hasPermission($data->to->filter))
                        ) && !$mcUser->ignores($data->from->uuid)
                    ) {
                        array_unshift($messages, $data);
                        $found = true;
                    }
                    if($data->time > $maxTime)
                        $maxTime = $data->time;
                }
            }
            if($found || ++$waited > 20)
                break;
            sleep(1);
        }

        $this->makeSuccess(array('time' => $maxTime, 'messages' => $messages));
    }

    private static function makeUUID() {
        return trim(uuid_create(UUID_TYPE_RANDOM));
    }

    public function sendAction() {
        $this->requireLoggedIn();
        $redis = \RedisL4::connection();
        $uuid = $this->user->getUUID();
        $message = \Input::get('message');

        $msguuid = self::makeUUID();

        $msgContents = array(
            'server' => 'Chat',
            'from' => array(
                'uuid' => $uuid,
                'name' => $redis->hget('playerUUIDToName', $uuid)
            ),
            'timestamp' => time(),
            'context' => $msguuid,
            'type' => 'text',
            'contents' => $message
        );

        $redis->lpush('foxbukkit:from_server', json_encode($msgContents));
        $this->makeSuccess(array('ok' => true, 'context' => $msguuid));
    }
} 