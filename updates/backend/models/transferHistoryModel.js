const mongoose = require('mongoose');

const transferHistorySchema = new mongoose.Schema({
  fromType: {
    type: String,
    enum: ['branch', 'technician'],
    required: true
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  toType: {
    type: String,
    enum: ['branch', 'technician'],
    required: true
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  serialNumber: {
    type: String
  },
  quantity: {
    type: Number,
    required: true
  },
  transferredAt: {
    type: Date,
    default: Date.now
  },
  transferredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const TransferHistory = mongoose.model('TransferHistory', transferHistorySchema);
module.exports = TransferHistory;