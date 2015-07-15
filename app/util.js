'use strict';

module.exports.getUnixTime = function () {
	return Math.floor(Date.now() / 1000);
};

module.exports.loadZMQConfig = function (config, socket) {
	config.forEach(function (srv) {
		switch(srv.mode.toLowerCase()) {
			case 'bind':
				socket.bind(srv.uri);
				break;
			case 'connect':
				socket.connect(srv.uri);
				break;
		}
	});
};
