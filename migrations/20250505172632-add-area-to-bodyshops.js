'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('Bodyshops', 'area', {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    //   defaultValue: ''
    // });
    console.log('Skipping add-area migration'); // Optional: Add a log message
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Bodyshops', 'area');
  }
};