'use strict';
module.exports = function(sequelize, DataTypes) {
	var UserFieldValue = sequelize.define('UserFieldValue', {
		userId: {
			type: DataTypes.INTEGER,
			field: 'user_id'
		},
		fieldId: {
			type: DataTypes.STRING(25),
			field: 'field_id'
		},
		fieldValue: {
			type: DataTypes.TEXT('MEDIUM'),
			field: 'field_value'
		}
	}, {
		tableName: 'xf_user_field_value',
		timestamps: false
	});
	UserFieldValue.removeAttribute('id');
	return UserFieldValue;
};
