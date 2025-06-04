'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_Jobs_status" ADD VALUE IF NOT EXISTS 'quoted';
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_Jobs_status" ADD VALUE IF NOT EXISTS 'paid';
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_Jobs_status" ADD VALUE IF NOT EXISTS 'processed';
  `);
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_Jobs_status" ADD VALUE IF NOT EXISTS 'waiting_customer_selection';
  `);
}

export async function down(queryInterface, Sequelize) {
  // No down method — PostgreSQL does not support removing enum values directly.
}
