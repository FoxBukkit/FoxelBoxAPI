<?php

use Illuminate\Console\Command;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Input\InputArgument;

class ChatDaemon extends Command {

	/**
	 * The console command name.
	 *
	 * @var string
	 */
	protected $name = 'chat:daemon';

	/**
	 * The console command description.
	 *
	 * @var string
	 */
	protected $description = 'Daemon command for chat.';

	/**
	 * Create a new command instance.
	 *
	 * @return ChatDaemon
	 */
	public function __construct()
	{
		parent::__construct();
	}

	/**
	 * Execute the console command.
	 *
	 * @return mixed
	 */
	public function fire()
	{
        $redis = Redis::connection();
        $pubSub = Redis::connection('pubsub')->pubSub();
        $pubSub->subscribe('foxbukkit:to_server');
        foreach($pubSub AS $message) {
            if($message->kind != 'message')
                continue;
            $data = json_decode($message->payload);
            $data->time = microtime(true);
            $redis->lpush('apiMessageCache', json_encode($data));
        }
	}

	/**
	 * Get the console command arguments.
	 *
	 * @return array
	 */
	protected function getArguments()
	{
		return array(
			//array('example', InputArgument::REQUIRED, 'An example argument.'),
		);
	}

	/**
	 * Get the console command options.
	 *
	 * @return array
	 */
	protected function getOptions()
	{
		return array(
			//array('example', null, InputOption::VALUE_OPTIONAL, 'An example option.', null),
		);
	}

}
