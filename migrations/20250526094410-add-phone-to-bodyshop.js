// migrations/20250526094410-add-phone-to-bodyshop.js
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Bodyshops', 'phone', {
    type: Sequelize.STRING,
    allowNull: true, // allow null for now
    unique: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Bodyshops', 'phone');
}