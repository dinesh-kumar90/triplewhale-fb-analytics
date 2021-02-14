'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Campaigns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      campaign_id: {
        type: Sequelize.STRING
      },
      spend_cap: {
        type: Sequelize.FLOAT
      },
      total_spend: {
        type: Sequelize.FLOAT
      },
      campaign_start_date: {
        type: Sequelize.DATE
      },
      campaign_status: {
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
    await queryInterface.dropTable('Campaigns');
  }
};