'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Insight extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Insight.init({
    campaign_id: DataTypes.STRING,
    roas: DataTypes.STRING,
    spend: DataTypes.STRING,
    impressions: DataTypes.STRING,
    cpc: DataTypes.STRING,
    cpm: DataTypes.STRING,
    revenue: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Insight',
  });
  return Insight;
};