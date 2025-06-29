'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    static associate(models) {
      // No associations yet, but ready for future roles
    }
  }

  Admin.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'admin'
    }
  }, {
    sequelize,
    modelName: 'Admin',
    tableName: 'Admins', 
    timestamps: true
  });

  return Admin;
};
