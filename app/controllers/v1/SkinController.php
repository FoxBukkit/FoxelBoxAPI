<?php
namespace APIv1;

class SkinController extends APIController {
    public function headAction($uuid) {
        if(strtolower(substr($uuid, -4)) == '.png')
            $uuid = substr($uuid, 0, -4);

        if($uuid == 'myself')
            $uuid = $this->user->getUUID();

        $avatarStorage = storage_path().'/cache/avatars/head/'.$uuid.'.png';

        if(file_exists($avatarStorage) && filemtime($avatarStorage) > time() - 600) {
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