<?php
namespace APIv1;

class SkinController extends APIController {
    public function headAction($uuid) {
        if($uuid == 'myself')
            $uuid = $this->user->getUUID();
        \SkinGetter::printHead($uuid, \Input::get('size', '48'));
        exit;
    }
} 