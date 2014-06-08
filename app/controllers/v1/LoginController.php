<?php
namespace APIv1;

class LoginController extends APIController {
    public function authAction() {
        $username = \Input::get('username');
        $password = \Input::get('password');

        $user = \User::where('username', $username)->first();
        if(empty($user))
            $this->makeError('User not found');
        if(!$user->checkPassword($password))
            $this->makeError('Password wrong');

        $this->user = $user;
        $this->generateSessionData();
        $this->makeSuccess(array('ok' => true));
    }

    public function verifyAction() {
        $this->requireLoggedIn();
        $this->makeSuccess(array('ok' => true));
    }
}