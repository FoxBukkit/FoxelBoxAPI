<?php
namespace APIv1;

class APIController extends \Controller {
    protected $user;
    protected $session_data;
    protected function requireLoggedIn() {
        if(!\Input::has('session_id'))
            $this->makeError('Missing session_id');
        $session_data = explode('|', \Crypt::decrypt(\Input::get('session_id')), 2);
        if(empty($session_data) || sha1($session_data[1]) != $session_data[0])
            $this->makeError('Tampered data', true);
        $this->session_data = unserialize($session_data[1]);
        if($this->session_data->time - time() > 360)
            $this->makeError('Session outdated', true);
        $this->user = \User::get($this->session_data->user_id);
        if(empty($this->user))
            $this->makeError('Not logged in', true);
    }

    protected function makeSuccess($result) {
        die(json_encode(array('success' => true, 'result' => $result)));
    }

    protected function makeError($message, $retry = false) {
        die(json_encode(array('success' => false, 'retry' => $retry, 'message' => $message)));
    }
}