'use strict';
module.exports = function(sequelize, DataTypes) {
	var UserAuthenticate = sequelize.define('UserAuthenticate', {
		userId: {
			type: DataTypes.INTEGER,
			field: 'user_id'
		},
		schemeClass: {
			type: DataTypes.STRING(50),
			field: 'scheme_class'
		},
		data: DataTypes.BLOB('MEDIUM')
	}, {
		tableName: 'xf_user_authenticate',
		timestamps: false
	});
	UserAuthenticate.removeAttribute('id');
	return UserAuthenticate;
};
