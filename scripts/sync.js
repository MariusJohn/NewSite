// scripts/sync.js
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.sync({ alter: true }); // use { force: true } to drop all data (careful!)
    console.log('✅ Database synced');
    process.exit();
  } catch (err) {
    console.error('❌ Sync error:', err);
    process.exit(1);
  }
})();
