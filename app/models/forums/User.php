<?php
define('XENFORO_PASSWORD_ITERATIONS', 10);

class User extends Eloquent {
    protected $connection = 'forums';
    protected $table = 'xf_user';
    protected $primaryKey = 'user_id';

    private function xenForoHash($hashFunc, $data) {
        switch ($hashFunc) {
            case 'sha256':
            default:
                return hash('sha256', $data);
            case 'sha1':
                return sha1($data);
        }
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
                return $this->xenForoHash($hashFunc, ($this->xenForoHash($hashFunc, $password) . $authData['salt'])) === $hashFunc['hash'];
            default:
                return false;
        }
    }
}