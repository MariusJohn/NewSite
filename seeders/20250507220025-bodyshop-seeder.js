// seeders/20250507220025-bodyshop-seeder.js
import bcrypt from 'bcrypt';

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    const bodyshops = [
      {
        name: 'Test Bodyshop 1',
        email: 'test1@bodyshop.com',
        password: hashedPassword,
        area: 'London',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Test Bodyshop 2',
        email: 'test2@bodyshop.com',
        password: hashedPassword,
        area: 'Manchester',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Bodyshops', bodyshops, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bodyshops', null, {});
  }
};