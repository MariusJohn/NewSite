export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Quotes_status') THEN
        CREATE TYPE "enum_Quotes_status" AS ENUM ('pending', 'won', 'lost');
      END IF;

      BEGIN
        ALTER TYPE "enum_Quotes_status" ADD VALUE 'under_review';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END;

      BEGIN
        ALTER TYPE "enum_Quotes_status" ADD VALUE 'expired';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END;
    END
    $$;
  `);
}

export async function down(queryInterface, Sequelize) {

}