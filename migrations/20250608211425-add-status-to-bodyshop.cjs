'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Bodyshops', 'status', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'active',
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Bodyshops', 'status');
}
};