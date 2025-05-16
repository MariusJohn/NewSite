require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true',
    timezone: '+00:00',
    dialectOptions: isProduction
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}
  },
  test: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00',
    dialectOptions: isProduction
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },