'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    await queryInterface.bulkInsert('Bodyshops', [
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
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bodyshops', null, {});
  }
};