<?php
define('XENFORO_PASSWORD_ITERATIONS', 10);

class User extends Eloquent {
    protected $connection = 'forums';
    protected $table = 'xf_user';
    protected $primaryKey = 'user_id';

    private $_uuid;

    public function getUUID() {
        if($this->_uuid)
            return $this->_uuid;
        $field = UserField::where('user_id', $this->user_id)->where('field_id', 'minecraft_uuid')->first();
        if(empty($field) || empty($field->field_value))
            return null;
        $this->_uuid = $field->field_value;
        return $this->_uuid;
    }

    public function getRank() {
        return RedisL4::connection()->hget('playergroups', $this->getUUID());
    }

    private static function getRankLevel($rank) {
        return RedisL4::connection()->hget('ranklevels', $rank);
    }

    public function getLevel() {
        return self::getRankLevel($this->getRank());
    }

    public function getName() {
        return RedisL4::connection()->hget('playerUUIDToName', $this->getUUID());
    }

    public function getFullNickAndTag() {
        $redis = RedisL4::connection();
        $nick = $redis->hget('playernicks', $this->getUUID());
        if(empty($nick))
            $nick = $this->getName();
        $tag = '';
        $tagAdd = $redis->hget('playerTags', $this->getUUID());
        if(!empty($tagAdd))
            $tag .= $tagAdd . ' ';
        $tagAdd = $redis->hget('playerRankTags', $this->getUUID());
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
            return true;
            //return $this->getLevel() >= self::getRankLevel('op');
        return false;
    }

    public function checkPassword($password) {
        $auth = UserAuthentication::where('user_id', $this->user_id)->where('scheme_class', '!=', 'XenForo_Authentication_NoPassword')->first();
        if(empty($auth))
            return false;
        $authData = unserialize($auth->data);
        switch($auth->scheme_class) {
            case 'XenForo_Authentication_wBB3':
                return $authData['hash'] === sha1($authData['salt'] . sha1($authData['salt'] . sha1($password)));
            case 'XenForo_Authentication_Core12':
                $passwordHash = new XenForo_PasswordHash(XENFORO_PASSWORD_ITERATIONS, false);
                return $passwordHash->CheckPassword($password, $authData['hash']);
            case 'XenForo_Authentication_Core':
                $hashFunc = $authData['hashFunc'];
                return $this->__xenForoHash($hashFunc, ($this->__xenForoHash($hashFunc, $password) . $authData['salt'])) === $hashFunc['hash'];
            default:
                return false;
        }
    }

    private function __xenForoHash($hashFunc, $data) {
        switch ($hashFunc) {
            case 'sha256':
            default:
                return hash('sha256', $data);
            case 'sha1':
                return sha1($data);
        }
    }
}