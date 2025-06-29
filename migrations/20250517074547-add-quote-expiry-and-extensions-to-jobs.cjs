'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobs', 'quoteExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal(`NOW() + interval '48 hours'`)
    });

    await queryInterface.addColumn('Jobs', 'extended', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('Jobs', 'extensionRequestedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Jobs', 'quoteCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Jobs', 'extensionCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Jobs', 'customerDecision', {
      type: Sequelize.ENUM('waiting', 'accepted', 'rejected', 'pending_payment'),
      defaultValue: 'waiting'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobs', 'quoteExpiry');
    await queryInterface.removeColumn('Jobs', 'extended');
    await queryInterface.removeColumn('Jobs', 'extensionRequestedAt');
    await queryInterface.removeColumn('Jobs', 'quoteCount');
    await queryInterface.removeColumn('Jobs', 'extensionCount');
    await queryInterface.removeColumn('Jobs', 'customerDecision');
  }
};
