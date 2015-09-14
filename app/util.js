'use strict';

var uuid = require('uuid');
var Long = require('long');

module.exports.getUnixTime = function () {
	return Math.floor(Date.now() / 1000);
};

module.exports.loadZMQConfig = function (config, socket) {
	config.forEach(function (srv) {
		switch (srv.mode.toLowerCase()) {
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
	var view = new Uint8Array(buffer);
	return uuid.unparse(view);
};

module.exports.writeProtobufUUID = function (uuidUuid) {
	var buffer = new ArrayBuffer(16); // 16 bytes = 128 bits
	var view = new Uint8Array(buffer);
	uuid.parse(uuidUuid, view, 0);
	var dataview = new DataView(buffer);
	return {
		msb: new Long(dataview.getInt32(4), dataview.getInt32(0)),
		lsb: new Long(dataview.getInt32(12), dataview.getInt32(8))
	};
};
