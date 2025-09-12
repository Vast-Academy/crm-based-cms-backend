const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const salesBillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerType: {
    type: String,
    enum: ['dealer', 'distributor', 'customer'],
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'customerModel'
  },
  customerModel: {
    type: String,
    required: true,
    enum: ['Dealer', 'Distributor', 'Customer']
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  items: [billItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String
  },
  qrCodeData: {
    type: String
  },
  notes: {
    type: String
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Bill number is now generated in the controller before saving

// Create indexes for better performance
// Note: billNumber already has unique index from schema definition
salesBillSchema.index({ customerId: 1, customerType: 1 });
salesBillSchema.index({ createdAt: -1 });
salesBillSchema.index({ branch: 1 });

const salesBillModel = mongoose.model('SalesBill', salesBillSchema);

module.exports = salesBillModel;