'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Reports.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Reports.init({
    userId: DataTypes.STRING,
    description: DataTypes.STRING,
    damageType: DataTypes.STRING,
    photoUrl: DataTypes.STRING,
    lat: DataTypes.FLOAT,
    lon: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Reports',
  });
  return Reports;
};