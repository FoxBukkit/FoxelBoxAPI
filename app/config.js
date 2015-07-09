'use strict';

var defaultConfig = require('./config/config.json');
var env = process.env.NODE_ENV || 'development';
var envConfig = require('./config/' + env + '.json');
var _ = require('lodash');
module.exports = _.extend(defaultConfig, envConfig);
