const TransferHistory = require('../../models/transferHistoryModel');
const User = require('../../models/userModel');
const Item = require('../../models/inventoryModel');
const Branch = require('../../models/branchModel');

const getTransferHistory = async (req, res) => {
  try {
    // Only managers can view transfer history
    if (req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only managers can view transfer history.'
      });
    }
    
    // Get all transfers related to manager's branch
    const transfers = await TransferHistory.find({
      $or: [
        { fromType: 'branch', fromId: req.userBranch },
        { toType: 'branch', toId: req.userBranch }
      ]
    })
    .populate('item', 'id name type unit')
    .populate('transferredBy', 'firstName lastName email')
    .sort('-transferredAt');
    
    // Get all users involved in transfers (for display names)
    const userIds = [];
    transfers.forEach(transfer => {
      if (transfer.fromType === 'technician') userIds.push(transfer.fromId);
      if (transfer.toType === 'technician') userIds.push(transfer.toId);
    });
    
    const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName');
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
      } else {
        formatted.from = userMap[transfer.fromId.toString()] || 'Unknown Technician';
      }
      
      if (transfer.toType === 'branch') {
        formatted.to = 'Branch Inventory';
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
    console.error('Error fetching transfer history:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = getTransferHistory;