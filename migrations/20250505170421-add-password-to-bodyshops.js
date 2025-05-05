 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Bodyshops', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''  // Required to avoid existing rows breaking
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Bodyshops', 'password');
  }
};
