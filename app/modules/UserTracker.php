<?php
class UserTracker {
    public static function removeUser($uuid) {
        $redis = RedisL4::connection();
        if($redis->hdel('apiUserTracker', $uuid) > 0)
            self::refreshList(true);
    }

    public static function addUser($uuid) {
        $redis = RedisL4::connection();
        if($redis->hset('apiUserTracker', $uuid, time() + 60) > 0)
            self::refreshList(true);
    }

    public static function refreshList($force = false, $cleanup = false) {
        $redis = RedisL4::connection();
        $time = time();
        $changes = $force ? 1 : 0;

        if($cleanup) {
            $trackedUsers = $redis->hgetall('apiUserTracker');
            foreach($trackedUsers AS $key => $value)
                if(((int)$value) < $time)
                    $changes += $redis->hdel('apiUserTracker', $key);
        }

        if($changes > 0) {
            $trackedUsers = $redis->hgetall('apiUserTracker');
            $redis->del('playersOnline:Chat');
            foreach($trackedUsers AS $key => $value)
                $redis->lpush('playersOnline:Chat', $key);
        }
    }
}