'use strict';
module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('User', {
		user_id: {//HACK FUCK THIS SHIT
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				field: 'user_id'
			},
			username: DataTypes.STRING(50)
		}, {
			tableName: 'xf_user',
			timestamps: false,
			classMethods: {
				associate: function(models) {
					this.hasMany(models.UserAuthenticate, {
						foreignKey: 'user_id'
					});
				}
			}
		}
	);
	return User;
};
