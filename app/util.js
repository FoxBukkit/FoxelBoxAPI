'use strict';

var uuid = require('uuid');
var Long = require('long');

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

module.exports.loadProtobufUUID = function (protobufUUID) {
	var buffer = new ArrayBuffer(16); // 16 bytes = 128 bits
	var dataview = new DataView(buffer);
	dataview.setInt32(0, protobufUUID.msb.high, false);
	dataview.setInt32(4, protobufUUID.msb.low, false);
	dataview.setInt32(8, protobufUUID.lsb.high, false);
	dataview.setInt32(12, protobufUUID.lsb.low, false);

	return uuid.unparse(new Uint8Array(buffer));
}

module.exports.writeProtobufUUID = function (uuidUuid) {
	return {
		msb: new Long(0),
		lsb: new Long(0)
	};
}
