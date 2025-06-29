import bcrypt from 'bcrypt';

export async function up(queryInterface, Sequelize) {
  const hashedPassword = await bcrypt.hash('your-password', 10);
  return queryInterface.bulkInsert('Admins', [
    {
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);
}

export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete('Admins', { email: 'admin@example.com' });
}
