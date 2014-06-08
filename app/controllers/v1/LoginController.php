<?php
namespace APIv1;

class LoginController extends APIController {
    public function indexAction() {
        $username = \Input::get('username');
        $password = \Input::get('password');

        $user = \User::where('username', $username)->first();
        if(empty($user))
            $this->makeError('User not found');
        if(!$user->checkPassword($password))
            $this->makeError('Password wrong');



        $this->makeSuccess(array('session_id' => \Session::getId()));
    }
}