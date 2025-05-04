// controllers/inventory/getTechnicianInventoryHistory.js
const TransferHistory = require('../../models/transferHistoryModel');
const User = require('../../models/userModel');
const Item = require('../../models/inventoryModel');

const getTechnicianInventoryHistory = async (req, res) => {
  try {
    // Get technician ID from request parameters
    const { technicianId } = req.params;
    
    // Only managers can view technician inventory history
    if (req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only managers can view inventory history.'
      });
    }

    // Validate that the technician belongs to the manager's branch
    const technician = await User.findOne({ 
      _id: technicianId,
      branch: req.userBranch
    });
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found or does not belong to your branch.'
      });
    }
    
    // Get all transfers related to this technician
    const transfers = await TransferHistory.find({
      $or: [
        { fromType: 'technician', fromId: technicianId },
        { toType: 'technician', toId: technicianId }
      ]
    })
    .populate('item', 'id name type unit')
    .populate('transferredBy', 'firstName lastName email')
    .sort('-transferredAt');
    
    // Get all users involved in transfers (for display names)
    const userIds = [];
    transfers.forEach(transfer => {
      if (transfer.fromType === 'technician' && transfer.fromId.toString() !== technicianId) {
        userIds.push(transfer.fromId);
      }
      if (transfer.toType === 'technician' && transfer.toId.toString() !== technicianId) {
        userIds.push(transfer.toId);
      }
    });
    
    const users = await User.find({ 
      _id: { $in: userIds }
    }, 'firstName lastName');
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = `${user.firstName} ${user.lastName}`;
    });
    
    // Format the response
    const formattedTransfers = transfers.map(transfer => {
      const formatted = {
        id: transfer._id,
        timestamp: transfer.transferredAt,
        itemName: transfer.item ? transfer.item.name : 'Unknown Item',
        itemId: transfer.item ? transfer.item.id : 'Unknown',
        type: transfer.item ? transfer.item.type : 'unknown',
        unit: transfer.item ? transfer.item.unit : 'Piece',
        quantity: transfer.quantity,
        transferredBy: transfer.transferredBy ?
          `${transfer.transferredBy.firstName} ${transfer.transferredBy.lastName}` : 'Unknown'
      };
      
      // Add from/to names
      if (transfer.fromType === 'branch') {
        formatted.from = 'Branch Inventory';
      } else if (transfer.fromId.toString() === technicianId) {
        formatted.from = `${technician.firstName} ${technician.lastName}`;
      } else {
        formatted.from = userMap[transfer.fromId.toString()] || 'Unknown Technician';
      }
      
      if (transfer.toType === 'branch') {
        formatted.to = 'Branch Inventory';
      } else if (transfer.toId.toString() === technicianId) {
        formatted.to = `${technician.firstName} ${technician.lastName}`;
      } else {
        formatted.to = userMap[transfer.toId.toString()] || 'Unknown Technician';
      }
      
      // Add serial number if available
      if (transfer.serialNumber) {
        formatted.serialNumber = transfer.serialNumber;
      }
      
      return formatted;
    });
    
    res.json({
      success: true,
      count: formattedTransfers.length,
      data: formattedTransfers
    });
  } catch (err) {
    console.error('Error fetching technician inventory history:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = getTechnicianInventoryHistory;