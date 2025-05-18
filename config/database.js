// config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const shouldLog = process.env.DB_LOGGING === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: shouldLog ? console.log : false, // Use console.log if shouldLog is true, otherwise false
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    timezone: '+00:00',
});

export default sequelize;