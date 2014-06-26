<?php
namespace APIv1;

class SkinController extends APIController {
    public function headAction($uuid) {
        if($uuid == 'myself')
            $uuid = $this->user->getUUID();

        $avatarStorage = storage_path().'/cache/avatars/head/' . $uuid . '.png';

        $mtime = filemtime($avatarStorage);
        if($mtime && $mtime > time() - 600) {
            header('Content-Type: image/png');
            readfile($avatarStorage);
            exit;
        }
        $head = \SkinGetter::getHead($uuid);
        if(empty($head))
            die('ERROR');
        file_put_contents($avatarStorage, $head);
        
        header('Content-Type: image/png');
        die($head);
    }
} 