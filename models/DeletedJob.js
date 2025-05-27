// models/deletedjob.js
export default (sequelize, DataTypes) => {
    const DeletedJob = sequelize.define('DeletedJob', {
      jobId: DataTypes.INTEGER,
      customerName: DataTypes.STRING,
      customerEmail: DataTypes.STRING,
      location: DataTypes.STRING,
    });
  
    return DeletedJob;
  };
  