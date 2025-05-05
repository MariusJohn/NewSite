'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Jobs', 'selectedBodyshopId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Jobs', 'selectedBodyshopId');
  }
};

