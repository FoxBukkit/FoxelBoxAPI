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
        Route::post('login/verify', 'APIv1\LoginController@verifyAction');
    }
);