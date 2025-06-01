export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Jobs', 'selectedQuoteId', {
    type: Sequelize.INTEGER,
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Jobs', 'selectedQuoteId');
}
