// models/job.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Job = sequelize.define('Job', {
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  radius: {
    type: DataTypes.FLOAT,
    defaultValue: 10
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'approved',
      'allocated',
      'completed',
      'rejected',
      'archived',
      'deleted',
      'paid'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  selectedBodyshopId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  viewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  quoteStatus: {
    type: DataTypes.ENUM('no_quotes', 'quoted', 'actioned', 'approved'),
    defaultValue: 'no_quotes',
    allowNull: false
  },
  quoteCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quoteExpiry: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => new Date(Date.now() + 48 * 60 * 60 * 1000)
  },
  extensionRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  extended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  extensionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  customerDecision: {
    type: DataTypes.ENUM('waiting', 'accepted', 'rejected', 'pending_payment'),
    defaultValue: 'waiting',
    allowNull: false
  },
  finalDecisionRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  finalDecision: {
    type: DataTypes.ENUM('yes', 'no', 'customer_selected'),
    allowNull: true
  },
  daysPending: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  extendToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  extendTokenUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cancelTokenUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
    selectedQuoteId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
  
  
  
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (job) => {
      if (!job.quoteExpiry) {
        job.quoteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
      }
    },
    beforeUpdate: (job) => {
      job.lastActionDate = new Date();
    }
  }
});




export default Job;