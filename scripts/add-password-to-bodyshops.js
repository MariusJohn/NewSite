const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

(async () => {
  try {
    await sequelize.getQueryInterface().addColumn('Bodyshops', 'password', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    });

    console.log('✅ Column "password" added to Bodyshops table.');
    process.exit();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();
