'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FileShare extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      FileShare.belongsTo(models.File, { foreignKey: 'fileId', as: 'file' });
      FileShare.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  FileShare.init({
    fileId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    permission: DataTypes.STRING,
    token: DataTypes.STRING,
    expiresAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'FileShare',
  });
  return FileShare;
};