<?php
namespace APIv1;

class APIController extends \Controller {
    /**
     * @var \User
     */
    protected $user;
    protected $session_data;

    protected function requireLoggedIn() {
        if(!\Input::has('session_id'))
            $this->makeError('Missing session_id', true);
        $this->session_data = \Input::get('session_id');
        $session_decrypted = \Crypt::decrypt(\Input::get('session_id'));
        if($session_decrypted['time'] - time() > 600)
            $this->makeError('Session outdated', true);
        $this->user = \User::find($session_decrypted['user_id']);
        if(empty($this->user))
            $this->makeError('Not logged in');
        if(!$this->user->getUUID())
            $this->makeError('No UUID');
    }

    protected function generateSessionData() {
        $data = array(
            'user_id' => $this->user->user_id,
            'time' => time()
        );

        \UserTracker::addUser($this->user->getUUID());

        $this->session_data = \Crypt::encrypt($data);

        return $this->session_data;
    }

    protected function makeSuccess($result, $add_session_id = true) {
        die(json_encode(array('success' => true, 'session_id' => $add_session_id ? $this->generateSessionData() : '', 'result' => $result)));
    }

    protected function makeError($message, $retry = false) {
        die(json_encode(array('success' => false, 'retry' => $retry, 'message' => $message)));
    }
}