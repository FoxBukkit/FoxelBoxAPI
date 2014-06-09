<?php
class UserTracker {
    public static function removeUser($uuid) {
        $redis = Redis::connection();
        if($redis->hdel('apiUserTracker', $uuid) > 0)
            self::refreshList(true);
    }

    public static function addUser($uuid) {
        $redis = Redis::connection();
        if($redis->hset('apiUserTracker', $uuid, time() + 60) > 0)
            self::refreshList(true);
    }

    public static function refreshList($force = false, $cleanup = false) {
        $redis = Redis::connection();
        $time = time();
        $changes = $force ? 1 : 0;
        $redis->del('playersOnline:Chat');

        $trakcedUsers = $redis->hgetall('apiUserTracker');

        if($cleanup)
            foreach($trakcedUsers AS $key => $value)
                if(((int)$value) < $time)
                    $changes += $redis->hdel('apiUserTracker', $key);

        if($changes > 0)
            foreach($trakcedUsers AS $key => $value)
                $redis->lpush('playersOnline:Chat', $key);
    }
}