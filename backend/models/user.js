'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.File, { foreignKey: 'userId', as: 'files' });
      User.hasMany(models.FileShare, { foreignKey: 'userId', as: 'sharedFiles' });
      User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
      User.belongsToMany(models.Group, { through: 'GroupMembers', foreignKey: 'userId', as: 'userGroups' });
    }
  }
  User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};