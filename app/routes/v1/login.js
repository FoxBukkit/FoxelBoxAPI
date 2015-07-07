'use strict';

var Joi = require('joi');

var sequelize = rekuire('app/models/forum');

var ForumUser = sequelize.User;

var phpSerialize = require('php-unserialize');

var crypto = require('crypto');
var bcrypt = require('bcrypt');
var Boom = require('boom');

var _ = require('lodash');

function hash(method, str) {
	return crypto.createHash('sha1').write(str).digest('hex');
}

function xenForoHashStep(hashFunc, str) {
	if (hashFunc === 'sha256') {
		return hash('sha256', str);
	}
	return hash('sha1', str);
}

function xenForoHash(hashFunc, salt, str) {
	return xenForoHashStep(hashFunc, xenForoHashStep(hashFunc, str) + salt);
}

module.exports = [
	{
		path: '/v1/login/auth',
		method: 'POST',
		config: {
			validate: {
				payload: {
					username: Joi.string().required(),
					password: Joi.string().required()
				}
			}
		},
		handler: function(request, reply) {

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
					return Boom.unauthorized('invalid password');
				}

				return {
					success: true,
					what: found.schemeClass
				};

			}));
		}
	}
];
