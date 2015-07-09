'use strict';

var Promise = require('bluebird');
var Joi = require('joi');
var phpSerialize = require('php-unserialize');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var Boom = require('boom');
var _ = require('lodash');
var JWT   = require('jsonwebtoken');

var config = require('../../config');
var util = require('../../util');
var sequelize = require('../../models/forum');

var ForumUser = sequelize.User;

var UserTracker = require('../../models/redis/usertracker');

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

function makeUserSession (user) {
	return Promise.resolve(user).then(function (data) {
		if (!data) {
			throw 'Invalid username or password';
		}

		return data.extendWithUUID();
	}).
	then(function (data) {
		if (!data.uuid) {
			throw 'Your forums account has no /mclink\'ed account';
		}

		var expiresInSeconds = config.jsonWebToken.expiresIn;
		var expiresAt = util.getUnixTime() + expiresInSeconds;

		var sessionId = JWT.sign({
			userId: data.user_id,
			uuid: data.uuid
		}, config.jsonWebToken.secret, {
			expiresInSeconds: expiresInSeconds + 1
		});

		return UserTracker.add(data.uuid, expiresAt).thenResolve({
			success: true,
			result: {
				expiresAt: expiresAt,
				sessionId: sessionId
			}
		});
	});
}

module.exports = [
	{
		path: '/v2/login/verify',
		method: 'GET',
		handler: function (request, reply) {
			return reply({
				success: true
			});
		}
	},
	{
		path: '/v2/login/logout',
		method: 'POST',
		handler: function (request, reply) {
			return reply(UserTracker.remove(request.auth.credentials.uuid)
				.thenResolve({
				success: true
			}));
		}
	},
	{
		path: '/v2/login/refresh',
		method: 'POST',
		handler: function (request, reply) {
				reply(ForumUser.findOne({
					where: {
						user_id: request.auth.credentials.userId
					}
				})
				.then(makeUserSession)
				.catch(function(err) {
					if (typeof err === 'string') {
						return Boom.unauthorized(err);
					}
					throw err;
				}));
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

				return data;
			})
			.then(makeUserSession)
			.catch(function(err) {
				if (typeof err === 'string') {
					return Boom.unauthorized(err);
				}
				throw err;
			}));
		}
	}
];
