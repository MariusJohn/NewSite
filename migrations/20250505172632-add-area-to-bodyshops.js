'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Bodyshops', 'area', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '' // Or your desired default value
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Bodyshops', 'area');
  }
};