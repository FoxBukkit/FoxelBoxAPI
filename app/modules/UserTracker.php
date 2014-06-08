<?php
class UserTracker {
    public static function removeUser($uuid) {
        $redis = Redis::connection();
        if($redis->hdel('apiUserTracker', $uuid) > 0)
            self::refreshList();
    }

    public static function addUser($uuid) {
        $redis = Redis::connection();
        if($redis->hset('apiUserTracker', $uuid, time() + 60) > 0)
            self::refreshList();
    }

    public static function refreshList() {
        $redis = Redis::connection();
        $time = time();
        $redis->del('playersOnline:Chat');
        foreach($redis->hgetall('apiUserTracker') AS $key => $value)
            if(((int)$value) < $time)
                $redis->hdel('apiUserTracker', $key);
            else
                $redis->lpush('playersOnline:Chat', $key);
    }
}