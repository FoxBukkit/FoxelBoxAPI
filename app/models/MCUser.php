<?php

class MCUser {
    private $uuid;
    public function __construct($uuid) {
        $this->uuid = $uuid;
    }

    public function getUUID() {
        return $this->uuid;
    }

    public function getRank() {
        return RedisL4::connection()->hget('playergroups', $this->uuid);
    }

    private static function getRankLevel($rank) {
        return RedisL4::connection()->hget('ranklevels', $rank);
    }

    public function getLevel() {
        return self::getRankLevel($this->getRank());
    }

    public function getName() {
        return RedisL4::connection()->hget('playerUUIDToName', $this->uuid);
    }

    public function getFullNickAndTag() {
        $redis = RedisL4::connection();
        $nick = $redis->hget('playernicks', $this->uuid);
        if(empty($nick))
            $nick = $this->getName();
        $tag = '';
        $tagAdd = $redis->hget('playerTags', $this->uuid);
        if(!empty($tagAdd))
            $tag .= $tagAdd . ' ';
        $tagAdd = $redis->hget('playerRankTags', $this->uuid);
        if(!empty($tagAdd))
            $tag .= $tagAdd;
        else {
            $tagAdd = $redis->hget('ranktags', $this->getRank());
            if(!empty($tagAdd))
                $tag .= $tagAdd;
        }
        return $tag . $nick;
    }

    public function hasPermission($permissions) {
        if(in_array('foxbukkit.opchat', $permissions))
            return $this->getLevel() >= self::getRankLevel('op');
        return false;
    }
} 