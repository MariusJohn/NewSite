'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'cancelToken', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('Jobs', 'extendToken', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'cancelToken');
  await queryInterface.removeColumn('Jobs', 'extendToken');
}
