'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'cancelToken', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('Jobs', 'extendToken', {
    type: Sequelize.STRING,
    allowNull: true,
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'cancelToken');
  await queryInterface.removeColumn('Jobs', 'extendToken');
}
};
