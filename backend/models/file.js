'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      File.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      File.hasMany(models.FileShare, { foreignKey: 'fileId', as: 'shares' });
    }
  }
  File.init({
    filename: DataTypes.STRING,
    path: DataTypes.STRING,
    mimetype: DataTypes.STRING,
    size: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    isStarred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isTrashed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'File',
  });
  return File;
};