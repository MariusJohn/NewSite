export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'extendTokenUsed', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
  await queryInterface.addColumn('Jobs', 'cancelTokenUsed', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'extendTokenUsed');
  await queryInterface.removeColumn('Jobs', 'cancelTokenUsed');
}
