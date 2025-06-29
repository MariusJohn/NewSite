'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- Check if the enum type exists
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'enum_Jobs_finalDecision'
        ) THEN
          -- If it doesn't, create it with the 'customer_selected' value
          CREATE TYPE "enum_Jobs_finalDecision" AS ENUM ('customer_selected');
        ELSE
          -- If it does exist, only add the value if it's not already present
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'customer_selected'
            AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'enum_Jobs_finalDecision'
            )
          ) THEN
            ALTER TYPE "enum_Jobs_finalDecision" ADD VALUE 'customer_selected';
          END IF;
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    console.warn('⚠️ Down migration not implemented: Cannot remove enum values from PostgreSQL enums safely.');
  }
};
