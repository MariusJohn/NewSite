'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Quotes', 'status', {
    type: Sequelize.ENUM('pending', 'won', 'lost'),
    allowNull: false,
    defaultValue: 'pending'
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Quotes', 'status');
}
};