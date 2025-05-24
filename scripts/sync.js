// sync.js
const sequelize = require('./config/database');
const { Job } = require('./models');

(async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database synchronized successfully.");
    } catch (error) {
        console.error("Error synchronizing database:", error);
    } finally {
        process.exit();
    }
})();