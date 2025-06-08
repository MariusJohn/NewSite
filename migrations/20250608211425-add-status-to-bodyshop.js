
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Bodyshops', 'status', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'active',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Bodyshops', 'status');
}
