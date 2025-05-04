const User = require('../../models/userModel');
const OwnershipTransfer = require('../../models/ownershipTransferModel');

const initiateTransferController = async (req, res) => {
  try {
    const { newManagerId, message } = req.body;
    const oldManagerId = req.userId;

    console.log('Request body:', req.body);
console.log('User ID:', req.userId);
    
    // Validate inputs
    if (!newManagerId) {
      return res.status(400).json({
        message: 'New manager ID is required',
        error: true,
        success: false
      });
    }
    
    // Check if old manager is active
    const oldManager = await User.findById(oldManagerId);
    
    if (!oldManager || oldManager.role !== 'manager' || oldManager.activeManagerStatus !== 'active') {
      return res.status(403).json({
        message: 'Only active managers can initiate transfers',
        error: true,
        success: false
      });
    }
    
    // Check if new manager exists and is valid
    const newManager = await User.findById(newManagerId);
    
    if (!newManager || newManager.role !== 'manager' || 
        String(newManager.branch) !== String(oldManager.branch) ||
        newManager.activeManagerStatus !== 'pending') {
      return res.status(400).json({
        message: 'Invalid new manager selected',
        error: true,
        success: false
      });
    }
    
    // Check if a transfer is already in progress for this branch
    const existingTransfer = await OwnershipTransfer.findOne({
      branch: oldManager.branch,
      status: 'pending'
    });
    
    if (existingTransfer) {
      return res.status(400).json({
        message: 'A transfer is already in progress for this branch',
        error: true,
        success: false
      });
    }
    
    // Create transfer record
    const transfer = new OwnershipTransfer({
      branch: oldManager.branch,
      oldManager: oldManagerId,
      newManager: newManagerId,
      message,
      status: 'pending'
    });
    
    await transfer.save();

    console.log('Transfer created:', transfer);
    
    // Update manager statuses to reflect pending transfer
    await User.findByIdAndUpdate(oldManagerId, {
      activeManagerStatus: 'transferring'
    });

    console.log('Old manager status updated to transferring');
    
    res.status(201).json({
      message: 'Transfer initiated successfully',
      error: false,
      success: true,
      data: transfer
    });
  } catch (err) {
    console.error('Error in initiateTransfer:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = initiateTransferController;