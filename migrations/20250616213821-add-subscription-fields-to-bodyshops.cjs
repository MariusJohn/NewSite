'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Bodyshops', 'subscriptionStatus', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'trial'
  });

  await queryInterface.addColumn('Bodyshops', 'subscriptionType', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'free'
  });

  await queryInterface.addColumn('Bodyshops', 'subscriptionEndsAt', {
    type: Sequelize.DATE,
    allowNull: true
  });
},

async down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Bodyshops', 'subscriptionStatus');
  await queryInterface.removeColumn('Bodyshops', 'subscriptionType');
  await queryInterface.removeColumn('Bodyshops', 'subscriptionEndsAt');
}
};
