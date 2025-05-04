// utils/generateOrderId.js
const Customer = require('../models/customerModel');

const generateOrderId = async () => {
  // Create a unique order ID format: WO-YYYYMMDD-XXXX
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateStr = `${year}${month}${day}`;
  
  // Find the latest order ID with the same date prefix
  const latestOrder = await Customer.aggregate([
    { $unwind: "$workOrders" },
    { $match: { "workOrders.orderId": { $regex: `WO-${dateStr}-` } } },
    { $sort: { "workOrders.orderId": -1 } },
    { $limit: 1 }
  ]);
  
  let sequenceNumber = 1;
  
  if (latestOrder.length > 0) {
    // Extract the sequence number from the latest order ID
    const latestOrderId = latestOrder[0].workOrders.orderId;
    const latestSequence = parseInt(latestOrderId.split('-')[2]);
    sequenceNumber = latestSequence + 1;
  }
  
  // Format the sequence number to 4 digits
  const formattedSequence = String(sequenceNumber).padStart(4, '0');
  
  return `WO-${dateStr}-${formattedSequence}`;
};

module.exports = generateOrderId;