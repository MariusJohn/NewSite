'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'emailSentAt', {
    type: Sequelize.DATE,
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'emailSentAt');
}