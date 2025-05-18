// migrations/20250517074547-add-quote-expiry-and-extensions-to-jobs.js
import { DataTypes } from 'sequelize';

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').Sequelize} Sequelize
 */
export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Jobs', 'quoteExpiry', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal(`NOW() + interval '48 hours'`)
    });

    await queryInterface.addColumn('Jobs', 'extended', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    });

    await queryInterface.addColumn('Jobs', 'extensionRequestedAt', {
        type: DataTypes.DATE,
        allowNull: true
    });

    await queryInterface.addColumn('Jobs', 'quoteCount', {
        type: DataTypes.INTEGER,
        defaultValue: 0
    });

    await queryInterface.addColumn('Jobs', 'extensionCount', {
        type: DataTypes.INTEGER,
        defaultValue: 0
    });

    await queryInterface.addColumn('Jobs', 'customerDecision', {
        type: DataTypes.ENUM('waiting', 'accepted', 'rejected', 'pending_payment'),
        defaultValue: 'waiting'
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Jobs', 'quoteExpiry');
    await queryInterface.removeColumn('Jobs', 'extended');
    await queryInterface.removeColumn('Jobs', 'extensionRequestedAt');
    await queryInterface.removeColumn('Jobs', 'quoteCount');
    await queryInterface.removeColumn('Jobs', 'extensionCount');
    await queryInterface.removeColumn('Jobs', 'customerDecision');
}