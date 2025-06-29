
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

},

async down(queryInterface, Sequelize) {
  // Note: Postgres doesn't support removing ENUM values.
  console.warn('⚠️ Cannot revert ENUM addition in PostgreSQL');
}
};
