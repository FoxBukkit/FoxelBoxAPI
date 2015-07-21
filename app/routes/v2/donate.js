'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var Boom = require('boom');
var uuid = require('uuid');
var stringFormat = require('util').format;
var querystring = require('querystring');
var needle = Promise.promisifyAll(require('needle'));

var config = require('../../config');
var redis = require('../../redis');

var PAYPAL_URL_BASE;
if(config.paypal.sandbox) {
	PAYPAL_URL_BASE = 'https://www.sandbox.paypal.com';
} else {
	PAYPAL_URL_BASE = 'https://www.paypal.com';
}
var PAYPAL_URL_BUTTON = PAYPAL_URL_BASE + '/cgi-bin/webscr?cmd=_xclick&business=%s&lc=DE&item_name=FoxelBox%20Server&amount=%d&currency_code=USD&button_subtype=services&no_note=1&no_shipping=1&return=%s&cancel_return=%s&notify_url=%s&custom=%s';
var PAYPAL_URL_VERIFY = PAYPAL_URL_BASE + '/cgi-bin/webscr?cmd=_notify-validate&%s';

module.exports = [
	{
		path: '/v2/donate',
		method: 'GET',
		config: {
			validate: {
				query: {
					amount: Joi.number().min(1.00).precision(2).required()
				}
			},
			auth: false
		},
		handler: function (request, reply) {
			var amount = request.query.amount;
			var url = stringFormat(
				PAYPAL_URL_BUTTON,
				querystring.escape(config.paypal.email),
				amount,
				querystring.escape(config.baseUrl + '/v2/donate/end'),
				querystring.escape(config.baseUrl + '/v2/donate/end'),
				querystring.escape(config.baseUrl + '/v2/donate/notify'),
				querystring.escape(request.query.custom || 'N/A')
			);
			if (!request.query.shorten) {
				reply({
					success: true,
					result: url
				});
				return;
			}
		}
	},
	{
		path: '/v2/donate/notify',
		method: 'POST',
		config: {
			auth: false
		},
		handler: function (request, reply) {
			reply({
				success: true,
				result: 'OK'
			});

			var data = request.payload;
			var amount = parseFloat(data.mc_gross);

			redis.existsAsync('payments:' + data.txn_id)
			.then(function (exists) {
				if (exists && exists > 0) {
					throw 'PayPal: Duplicate txn: ' + data.txn_id;
				}
				if (data.payment_status !== 'Completed') {
					throw 'PayPal: Status = ' + data.payment_status;
				}
				if (data.receiver_email !== config.paypal.email) {
					throw 'PayPal: E-Mail = ' + data.receiver_email;
				}
				if(data.mc_currency !== 'USD') {
					throw 'PayPal: Currency = ' + data.mc_currency;
				}
				var verifyUrl = stringFormat(
					PAYPAL_URL_VERIFY,
					querystring.stringify(data)
				);
				return needle.getAsync(verifyUrl);
			})
			.spread(function (response) {
				if (response.statusCode !== 200) {
					throw 'PayPal verify: code ' + response.statusCode;
				}
				if(response.body.trim() !== 'VERIFIED') {
					throw 'PayPal verify: body ' + response.body;
				}
				return redis.setAsync('payments:' + data.txn_id, JSON.stringify(data));
			})
			.then(function () {
				return redis.incrbyAsync('donationTotal', amount);
			})
			.then(function () {
				return redis.incrbyAsync('donationCurrent', amount);
			})
			.catch(function (error) {
				console.error(error, error.stack);
			});
		}
	},
	{
		path: '/v2/donate/end',
		method: 'GET',
		config: {
			auth: false
		},
		handler: function (request, reply) {
			var playerUuid = request.auth.credentials.uuid;
			var message = request.payload.message;
			var context = uuid.v4();
			var player = Player.get(playerUuid);

			reply({
				success: true,
				result: 'OK'
			});
		}
	}
];
