const OwnershipTransfer = require('../../models/ownershipTransferModel');

const getRejectedTransfersController = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find rejected transfers initiated by this manager
    const rejectedTransfers = await OwnershipTransfer.find({
      oldManager: userId,
      status: 'rejected'
    }).populate('newManager', 'firstName lastName email')
      .sort({ rejectedAt: -1 })
      .limit(5); // Limit to recent 5
    
    res.status(200).json({
      message: 'Rejected transfers retrieved successfully',
      error: false,
      success: true,
      data: rejectedTransfers
    });
  } catch (err) {
    console.error('Error in getRejectedTransfers:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getRejectedTransfersController;