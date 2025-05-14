'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobs', 'radius', {
      type: Sequelize.FLOAT,
      allowNull: true, // Or false, depending on your requirements
      defaultValue: 10, // Or your desired default value
      after: 'longitude' // Adjust if you want it in a specific position
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobs', 'radius');
  }
};