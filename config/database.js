const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
    dialectOptions: {
        timeout: 30000  // 30 seconds
    }
});

module.exports = sequelize;