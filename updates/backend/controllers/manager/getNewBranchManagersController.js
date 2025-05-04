const User = require('../../models/userModel');
const OwnershipTransfer = require('../../models/ownershipTransferModel');

const getNewBranchManagersController = async (req, res) => {
  try {
    // Get the current user (should be a manager)
    const currentUser = await User.findById(req.userId);
    
    if (currentUser.role !== 'manager' || currentUser.activeManagerStatus !== 'active') {
      return res.status(403).json({
        message: 'Only active managers can view new branch managers',
        error: true,
        success: false
      });
    }
    
    // Find managers in the same branch who are not the current user
    // and have 'pending' activeManagerStatus
    const newManagers = await User.find({
      _id: { $ne: req.userId },
      role: 'manager',
      branch: currentUser.branch,
      activeManagerStatus: 'pending'
    }).select('-password');
    
    // Filter out managers who already have a transfer in progress
    const transfers = await OwnershipTransfer.find({
      branch: currentUser.branch,
      status: 'pending'
    });
    
    const transferManagerIds = transfers.map(t => t.newManager.toString());
    
    const availableManagers = newManagers.filter(
      manager => !transferManagerIds.includes(manager._id.toString())
    );
    
    res.status(200).json({
      message: 'New branch managers fetched successfully',
      error: false,
      success: true,
      data: availableManagers
    });
  } catch (err) {
    console.error('Error in getNewBranchManagers:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getNewBranchManagersController;