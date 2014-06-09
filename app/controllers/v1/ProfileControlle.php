<?php
namespace APIv1;

class ProfileController extends APIController {
    public function indexAction() {
        $this->requireLoggedIn();
        $this->makeSuccess(array(
            'Pretty name' => $this->user->getFullNickAndTag(),
            'Rank' => $this->user->getRank(),
            'Name' => $this->user->getName()
        ));
    }
} 