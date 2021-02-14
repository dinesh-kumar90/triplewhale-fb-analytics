'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Insights', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      campaign_id: {
        type: Sequelize.STRING
      },
      roas: {
        type: Sequelize.STRING
      },
      spend: {
        type: Sequelize.STRING
      },
      impressions: {
        type: Sequelize.STRING
      },
      cpc: {
        type: Sequelize.STRING
      },
      cpm: {
        type: Sequelize.STRING
      },
      revenue: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Insights');
  }
};