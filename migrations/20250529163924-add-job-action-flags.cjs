'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'extendTokenUsed', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
  await queryInterface.addColumn('Jobs', 'cancelTokenUsed', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'extendTokenUsed');
  await queryInterface.removeColumn('Jobs', 'cancelTokenUsed');
}
};
