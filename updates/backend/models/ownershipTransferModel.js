const mongoose = require('mongoose');

const OwnershipTransferSchema = new mongoose.Schema({
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    oldManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    newManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending'
    },
    message: {
      type: String
    },
    responseMessage: {
      type: String
    },
    rejectReason: {
      type: String
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    }
  });


  const ownerShipTransferModel = mongoose.model('OwnershipTransfer', OwnershipTransferSchema)
  module.exports = ownerShipTransferModel;