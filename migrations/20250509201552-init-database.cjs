'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // === Create Bodyshops Table ===
    await queryInterface.createTable('Bodyshops', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      area: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      verificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      resetToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      }
    });

    // === Create Jobs Table ===
    await queryInterface.createTable('Jobs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      images: {
        type: Sequelize.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('images');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue('images', JSON.stringify(value));
        },
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      selectedBodyshopId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Bodyshops',
          key: 'id',
        },
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      }
    });

    // === Create Quotes Table ===
    await queryInterface.createTable('Quotes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      bodyshopId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Bodyshops',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Jobs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Quotes');
    await queryInterface.dropTable('Jobs');
    await queryInterface.dropTable('Bodyshops');
  }
};