const User = require('../../models/userModel');
const OwnershipTransfer = require('../../models/ownershipTransferModel');

const rejectTransferController = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { rejectReason } = req.body;
    const userId = req.userId;
    
    console.log('Reject Transfer Request:', {
      transferId,
      userId,
      rejectReason
    });
    
    // Find transfer
    const transfer = await OwnershipTransfer.findById(transferId);
    
    if (!transfer) {
      console.log('Transfer not found');
      return res.status(400).json({
        message: 'Transfer not found',
        error: true,
        success: false
      });
    }
    
    console.log('Found transfer:', transfer);
    
    // Check if the transfer is pending
    if (transfer.status !== 'pending') {
      console.log('Transfer already processed');
      return res.status(400).json({
        message: 'Transfer has already been processed',
        error: true,
        success: false
      });
    }
    
    // Check if the requesting user is the new manager
    if (String(transfer.newManager) !== String(userId)) {
      console.log('User not authorized:', {
        transferNewManager: transfer.newManager,
        requestUserId: userId
      });
      return res.status(403).json({
        message: 'Only the new manager can reject the transfer',
        error: true,
        success: false
      });
    }
    
    // Validate reject reason
    if (!rejectReason || rejectReason.trim() === '') {
      return res.status(400).json({
        message: 'Reject reason is required',
        error: true,
        success: false
      });
    }
    
    console.log('Updating transfer status to rejected');
    
    // Update transfer status
    transfer.status = 'rejected';
    transfer.rejectReason = rejectReason;
    transfer.rejectedAt = new Date();
    await transfer.save();
    
    console.log('Updating old manager status back to active');
    
    // Reset old manager status back to active
    const oldManagerUpdate = await User.findByIdAndUpdate(transfer.oldManager, {
      activeManagerStatus: 'active'
    }, { new: true });
    
    console.log('Old manager updated:', oldManagerUpdate);
    
    res.status(200).json({
      message: 'Transfer rejected successfully',
      error: false,
      success: true,
      data: transfer
    });
  } catch (err) {
    console.error('Error in rejectTransfer:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = rejectTransferController;