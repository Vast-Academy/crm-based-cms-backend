const mongoose = require('mongoose');

const technicianInventorySchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  serializedItems: [{
    serialNumber: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'returned', 'lost', 'used'],
      default: 'active'
    },
    // Add these two new fields
    usedInWorkOrder: {
      type: String
    },
    usedAt: {
      type: Date
    }
  }],
  genericQuantity: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Create a compound index for technician + item uniqueness
technicianInventorySchema.index({ technician: 1, item: 1 }, { unique: true });

const technicianInventory = mongoose.model('TechnicianInventory', technicianInventorySchema);
module.exports = technicianInventory;