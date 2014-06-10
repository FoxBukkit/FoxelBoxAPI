<?php
namespace APIv1;

class ProfileController extends APIController {
    public function indexAction() {
        $this->requireLoggedIn();
        $this->makeSuccess(array(
            'Pretty name' => $this->user->getFullNickAndTag(),
            'Name' => $this->user->getName(),
            'Rank' => $this->user->getRank(),
            'Level' => $this->user->getLevel(),
        ));
    }
} 