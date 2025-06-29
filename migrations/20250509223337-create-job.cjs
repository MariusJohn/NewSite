// migrations/YYYYMMDDHHMMSS-create-job.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Jobs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customerEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'allocated', 'completed', 'rejected', 'archived', 'deleted'),
        defaultValue: 'pending',
        allowNull: false
      },
      selectedBodyshopId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Bodyshops',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Jobs');
  }
};