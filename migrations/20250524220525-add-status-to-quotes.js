export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Quotes', 'status', {
    type: Sequelize.ENUM('pending', 'won', 'lost'),
    allowNull: false,
    defaultValue: 'pending'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Quotes', 'status');
}