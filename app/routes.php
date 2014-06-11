<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/

Route::get('/', function()
{
	return View::make('apiinfo');
});

Route::group(
    array('prefix' => 'v1'),
    function() {
        Route::post('login/auth', 'APIv1\LoginController@authAction');
        Route::post('login/logout', 'APIv1\LoginController@logoutAction');
        Route::post('login/verify', 'APIv1\LoginController@verifyAction');

        Route::post('message/send', 'APIv1\MessageController@sendAction');
        Route::post('message/poll', 'APIv1\MessageController@pollAction');

        Route::post('profile', 'APIv1\ProfileController@indexAction');

        Route::post('player/list', 'APIv1\PlayerController@listAction');
        Route::post('player/info', 'APIv1\PlayerController@infoAction');
    }
);