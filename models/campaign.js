'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Campaign.init({
    account_id: DataTypes.STRING,
    name: DataTypes.STRING,
    campaign_id: DataTypes.STRING,
    spend_cap: DataTypes.FLOAT,
    total_spend: DataTypes.FLOAT,
    campaign_start_date: DataTypes.DATE,
    campaign_status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Campaign',
  });
  return Campaign;
};