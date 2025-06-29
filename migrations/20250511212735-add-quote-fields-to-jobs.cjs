'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Jobs');

    // Add 'lastActionDate'
    if (!table.lastActionDate) {
      await queryInterface.addColumn('Jobs', 'lastActionDate', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      });
    }

    // Add 'viewed'
    if (!table.viewed) {
      await queryInterface.addColumn('Jobs', 'viewed', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    // Add 'quoteStatus'
    if (!table.quoteStatus) {
      await queryInterface.addColumn('Jobs', 'quoteStatus', {
        type: Sequelize.ENUM('no_quotes', 'quoted', 'actioned', 'approved'),
        defaultValue: 'no_quotes',
        allowNull: false
      });
    }

    // Add 'daysPending'
    if (!table.daysPending) {
      await queryInterface.addColumn('Jobs', 'daysPending', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Jobs');

    // Remove 'lastActionDate'
    if (table.lastActionDate) {
      await queryInterface.removeColumn('Jobs', 'lastActionDate');
    }

    // Remove 'viewed'
    if (table.viewed) {
      await queryInterface.removeColumn('Jobs', 'viewed');
    }

    // Remove 'quoteStatus'
    if (table.quoteStatus) {
      await queryInterface.removeColumn('Jobs', 'quoteStatus');
    }

    // Remove 'daysPending'
    if (table.daysPending) {
      await queryInterface.removeColumn('Jobs', 'daysPending');
    }

    // Drop the ENUM type to avoid conflicts
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Jobs_quoteStatus";');
  }
};
