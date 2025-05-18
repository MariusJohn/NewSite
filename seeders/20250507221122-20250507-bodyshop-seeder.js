// seeders/20250507220130-multiple-bodyshops-seeder.js
import bcrypt from 'bcrypt';

export default {
  async up(queryInterface, Sequelize) {
    const bodyshops = [
      {
        name: 'Quick Fix Motors',
        email: 'quickfix@gmail.com',
        password: await bcrypt.hash('QuickFix123!', 10),
        area: 'NW1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fast Lane Repairs',
        email: 'fastlane@gmail.com',
        password: await bcrypt.hash('FastLane123!', 10),
        area: 'E2',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'City Auto Repair',
        email: 'cityauto@gmail.com',
        password: await bcrypt.hash('CityAuto123!', 10),
        area: 'W1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Metro Bodyworks',
        email: 'metrobody@gmail.com',
        password: await bcrypt.hash('MetroBody123!', 10),
        area: 'SE1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Elite Car Bodyshop',
        email: 'elitecar@gmail.com',
        password: await bcrypt.hash('EliteCar123!', 10),
        area: 'SW1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'The Dent Doctor',
        email: 'dentdoctor@gmail.com',
        password: await bcrypt.hash('DentDoc123!', 10),
        area: 'N1',
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