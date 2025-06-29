'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Bodyshops', 'latitude', {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Bodyshops', 'longitude', {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Bodyshops', 'radius', {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 10,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Bodyshops', 'latitude');
    await queryInterface.removeColumn('Bodyshops', 'longitude');
    await queryInterface.removeColumn('Bodyshops', 'radius');
  },
};
