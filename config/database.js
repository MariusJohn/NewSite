// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const shouldLog = process.env.DB_LOGGING === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: shouldLog ? console.log : false, // Use console.log if shouldLog is true, otherwise false
    dialectOptions: {
        ssl: isProduction ? { require: true, rejectUnauthorized: false } : false,
    },
    timezone: '+00:00',
});

module.exports = sequelize;