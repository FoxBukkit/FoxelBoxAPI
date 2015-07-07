<?php
class UserAuthentication extends Eloquent {
    protected $connection = 'forums';
    protected $table = 'xf_user_authenticate';
    protected $primaryKey = 'user_id';
}

class XenForo_PasswordHash {
    function CheckPassword($password, $stored_hash)
    {
        $hash = crypt($password, $stored_hash);

        return $hash == $stored_hash;
    }
}