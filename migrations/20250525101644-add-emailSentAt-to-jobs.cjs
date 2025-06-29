'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'emailSentAt', {
    type: Sequelize.DATE,
    allowNull: true
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'emailSentAt');
}
};