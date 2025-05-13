'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Bodyshops', 'radius', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 10
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Bodyshops', 'radius', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null
    });
  }
};