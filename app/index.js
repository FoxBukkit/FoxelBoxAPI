'use strict';

switch (process.argv[2]) {
	case '-daemon':
		require('./daemon');
		break;
	case '-server':
		require('./server');
		break;
	default:
		console.log('Please run with -daemon or -server');
}
