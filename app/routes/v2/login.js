'use strict';

var Joi = require('joi');
var phpSerialize = require('php-unserialize');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var Boom = require('boom');
var _ = require('lodash');
var JWT   = require('jsonwebtoken');

var config = require('../../config');
var sequelize = require('../../models/forum');

var ForumUser = sequelize.User;

function hash (method, str) {
	return crypto.createHash('sha1').write(str).digest('hex');
}

function xenForoHashStep (hashFunc, str) {
	if (hashFunc === 'sha256') {
		return hash('sha256', str);
	}
	return hash('sha1', str);
}

function xenForoHash (hashFunc, salt, str) {
	return xenForoHashStep(hashFunc, xenForoHashStep(hashFunc, str) + salt);
}

module.exports = [
	{
		path: '/v2/login/verify',
		method: 'GET',
		handler: function (request, reply) {
			return reply({ success: true });
		}
	},
	{
		path: '/v2/login/refresh',
		method: 'GET',
		handler: function (request, reply) {
				var sessionId = JWT.sign(request.auth.credentials, config.jsonWebToken.secret, {
					expiresInSeconds: config.jsonWebToken.expiresIn
				});

				return {
					success: true,
					result: {
						expiresIn: config.jsonWebToken.expiresIn,
						sessionId: sessionId
					}
				};
		}
	},
	{
		path: '/v2/login',
		method: 'POST',
		config: {
			auth: false,
			validate: {
				payload: {
					username: Joi.string().required(),
					password: Joi.string().required()
				}
			}
		},
		handler: function (request, reply) {
			var username = request.payload.username;
			var password = request.payload.password;

			reply(ForumUser.findOne({
				where: {
					username: username
				},
				include: {
					model: sequelize.UserAuthenticate,
					where: {
						$not: {
							scheme_class: 'XenForo_Authentication_NoPassword'
						}
					}
				}
			})
			.then(function(data) {
				if (!data) {
					throw 'Invalid username or password';
				}

				var found = _.find(data.UserAuthenticates, function(authenticate) {
					var authData = phpSerialize.unserialize(authenticate.data.toString());
					switch (authenticate.schemeClass) {
						case 'XenForo_Authentication_wBB3':
							return authData.hash === hash('sha1', authData.salt + hash('sha1', authData.salt) + hash('sha1', password));
						case 'XenForo_Authentication_Core12':
							return bcrypt.compareSync(password, authData.hash);
						case 'XenForo_Authentication_Core':
							return xenForoHash(authData.hashFunc, authData.salt, password) === authData.hash;
					}
				});

				if (!found) {
					throw 'Invalid username or password';
				}

				return data.extendWithUUID();
			}).then(function(data) {
				if (!data.uuid) {
					throw 'Your forums account has no /mclink\'ed account';
				}

				var sessionId = JWT.sign({ userId: data.user_id, uuid: data.uuid }, config.jsonWebToken.secret, {
					expiresInSeconds: config.jsonWebToken.expiresIn
				});

				return {
					success: true,
					result: {
						expiresIn: config.jsonWebToken.expiresIn,
						sessionId: sessionId
					}
				};

			}).catch(function(err) {
				if (typeof err === 'string') {
					return Boom.unauthorized(err);
				}
				throw err;
			}));
		}
	}
];
