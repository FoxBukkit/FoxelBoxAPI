var fs = require('fs');
var ProtoBuf = require('protobufjs');
module.exports = ProtoBuf.loadProtoFile(__dirname + '/messages.proto').build('com.foxelbox.chatproto');

