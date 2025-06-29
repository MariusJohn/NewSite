'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Bodyshops', 'phone', {
    type: Sequelize.STRING,
    allowNull: true, // allow null for now
    unique: true
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Bodyshops', 'phone');
}
};