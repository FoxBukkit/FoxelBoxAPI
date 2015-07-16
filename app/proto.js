var fs = require('fs');
var ProtoBuf = require('protobufjs');
var protoTbl = ProtoBuf.loadProtoFile(__dirname + '/messages.proto').build('com.foxelbox.chatproto');
function makeLookup(subTbl) {
	var lookupTbl = subTbl + 'Lookup';
	var enumTbl = protoTbl[subTbl];
	var tbl = {};
	for(var idx in enumTbl) {
		tbl[enumTbl[idx]] = idx;
	}
	protoTbl[lookupTbl] = tbl;
}
makeLookup('MessageType');
makeLookup('TargetType');
module.exports = protoTbl;
