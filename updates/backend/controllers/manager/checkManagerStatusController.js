const User = require('../../models/userModel');
const OwnershipTransfer = require('../../models/ownershipTransferModel');

const checkManagerStatusController = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if user is a manager
    const user = await User.findById(userId);
    
    // console.log('Checking manager status for user:', user);
    
    if (!user || user.role !== 'manager') {
      return res.status(403).json({
        message: 'Only managers can access this endpoint',
        error: true,
        success: false
      });
    }
    
    // Get active manager status
    const activeManagerStatus = user.activeManagerStatus || 'active';
    
    // console.log('Active manager status:', activeManagerStatus);
    
    // Check if there's any pending transfer related to this manager
    const asOldManager = await OwnershipTransfer.findOne({
      oldManager: userId,
      status: 'pending'
    }).populate('newManager', 'firstName lastName email');
    
    const asNewManager = await OwnershipTransfer.findOne({
      newManager: userId,
      status: 'pending'
    }).populate('oldManager', 'firstName lastName email')
      .populate('branch', 'name location');
    
    // Check for completed transfers (to get response message)
    const completedTransfer = await OwnershipTransfer.findOne({
      oldManager: userId,
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(1);
    
    // Check for recently rejected transfers
    const rejectedTransfers = await OwnershipTransfer.find({
      oldManager: userId,
      status: 'rejected'
    }).populate('newManager', 'firstName lastName email')
      .sort({ rejectedAt: -1 })
      .limit(1);
    
    console.log('Transfers found:', { 
      asOldManager, 
      asNewManager, 
      completedTransfer,
      rejectedTransfers 
    });
    
    // Determine which transfer is relevant
    let transfer = null;
    
    if (asNewManager) {
      transfer = asNewManager;
    } else if (asOldManager) {
      transfer = asOldManager;
    }
    
    res.status(200).json({
      message: 'Manager status retrieved',
      error: false,
      success: true,
      data: {
        activeManagerStatus,
        transfer,
        completedTransfer,
        rejectedTransfers: rejectedTransfers.length > 0 ? rejectedTransfers : null
      }
    });
  } catch (err) {
    console.error('Error in checkManagerStatus:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = checkManagerStatusController;