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
        if(!$user->getUUID())
            $this->makeError('No UUID');

        $this->user = $user;
        $this->session_data = null;
        $this->generateSessionData();
        $this->makeSuccess(array('ok' => true));
    }

    public function logoutAction() {
        $this->requireLoggedIn();
        \UserTracker::removeUser($this->user->getUUID());
        \Cache::put('session_' . $this->session_data, null, 1);
        $this->makeSuccess(array('ok' => true), false);
    }

    public function verifyAction() {
        $this->requireLoggedIn();
        $this->makeSuccess(array('ok' => true));
    }
}