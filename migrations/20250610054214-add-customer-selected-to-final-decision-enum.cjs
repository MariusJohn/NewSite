'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'customer_selected' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_Jobs_finalDecision'
          )
        ) THEN
          ALTER TYPE "enum_Jobs_finalDecision" ADD VALUE 'customer_selected';
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {

  }
};
