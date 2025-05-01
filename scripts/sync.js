const { sequelize } = require('../models');

sequelize.sync({ force: false })  // force: true resets DB
  .then(() => {
    console.log('Database synced.');
    process.exit();
  })
  .catch(err => {
    console.error('Error syncing:', err);
  });
