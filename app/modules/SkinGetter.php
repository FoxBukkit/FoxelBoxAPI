<?php

/*
Title:      Minecraft Avatar
URL:        http://github.com/jamiebicknell/Minecraft-Avatar
Author:     Jamie Bicknell
Twitter:    @jamiebicknell
*/

class SkinGetter {
    private static function getDataFromURL($url, $json = true) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $output = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($status != '200')
            return null;
        if($json)
            return json_decode($output);
        return $output;
    }

    public static function getTextureData($uuid) {
        $skinData = self::getDataFromURL('https://sessionserver.mojang.com/session/minecraft/profile/' . str_replace('-', '', $uuid) . '?unsigned=true');
        if(empty($skinData))
            return null;
        foreach($skinData->properties AS $property)
            if($property->name == 'textures')
                return json_decode(base64_decode($property))->textures;
        return null;
    }

    public static function getBodyTexture($uuid) {
        $skinData = self::getTextureData($uuid);
        return self::getDataFromURL($skinData->SKIN, false);
    }

    public static function printHead($uuid, $size = 48) {
        $size = (int)$size;
        if($size < 8)
            $size = 8;
        if($size > 250)
            $size = 250;

        $skin = self::getBodyTexture($uuid);

        $im = imagecreatefromstring($skin);
        $av = imagecreatetruecolor($size, $size);
        imagecopyresized($av, $im, 0, 0, 8, 8, $size, $size, 8, 8);    // Face
        imagecolortransparent($im, imagecolorat($im, 63, 0));    // Black Hat Issue
        imagecopyresized($av, $im, 0, 0, 40, 8, $size, $size, 8, 8);   // Accessories
        header('Content-type: image/png');
        imagepng($av);
        imagedestroy($im);
        imagedestroy($av);
    }
}
