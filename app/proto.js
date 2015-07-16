var fs = require('fs');
var ProtoBuf = require('protobufjs');
module.exports = ProtoBuf.loadProtoFile('messages.proto').build('com.foxelbox.chatproto');

