// migrations/YYYYMMDDHHMMSS-add-pending-payment-status.js

export async function up(queryInterface, Sequelize) {

}

export async function down(queryInterface, Sequelize) {
  // Note: Postgres doesn't support removing ENUM values.
  console.warn('⚠️ Cannot revert ENUM addition in PostgreSQL');
}
