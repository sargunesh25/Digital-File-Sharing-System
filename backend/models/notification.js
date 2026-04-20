'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      // define association here
      Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  Notification.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'SYSTEM'
    }
  }, {
    sequelize,
    modelName: 'Notification',
  });
  return Notification;
};
