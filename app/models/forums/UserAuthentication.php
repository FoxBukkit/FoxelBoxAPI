<?php
class UserAuthentication extends Eloquent {
    protected $connection = 'forums';
    protected $table = 'xf_user_authenticate';
    protected $primaryKey = 'user_id';
}
