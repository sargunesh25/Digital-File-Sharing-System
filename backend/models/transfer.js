'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Transfer extends Model {
        static associate(models) {
            Transfer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    Transfer.init({
        userId: DataTypes.INTEGER,
        filename: DataTypes.STRING,
        size: DataTypes.BIGINT,
        senderDevice: DataTypes.STRING,
        receiverDevice: DataTypes.STRING,
        method: {
            type: DataTypes.STRING,
            defaultValue: 'p2p' // 'p2p' or 'server'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'completed' // 'completed', 'failed'
        },
        duration: DataTypes.INTEGER // milliseconds
    }, {
        sequelize,
        modelName: 'Transfer',
    });
    return Transfer;
};
