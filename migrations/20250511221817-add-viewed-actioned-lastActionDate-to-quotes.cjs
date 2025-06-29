'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Quotes', 'viewed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Quotes', 'actioned', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Quotes', 'lastActionDate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Quotes', 'viewed');
    await queryInterface.removeColumn('Quotes', 'actioned');
    await queryInterface.removeColumn('Quotes', 'lastActionDate');
  }
};