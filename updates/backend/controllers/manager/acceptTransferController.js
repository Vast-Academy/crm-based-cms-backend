const User = require('../../models/userModel');
const OwnershipTransfer = require('../../models/ownershipTransferModel');

const acceptTransferController = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { responseMessage } = req.body;
    const userId = req.userId;
    
    console.log('Accept Transfer Request:', {
      transferId,
      userId
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
        message: 'Only the new manager can accept the transfer',
        error: true,
        success: false
      });
    }
    
    console.log('Updating transfer status to completed');
    
    // Update transfer status
    transfer.status = 'completed';
    transfer.responseMessage = responseMessage || '';
    transfer.completedAt = new Date();
    await transfer.save();
    
    console.log('Updating old manager status to transferred');
    
    // Update old manager status
    const oldManagerUpdate = await User.findByIdAndUpdate(transfer.oldManager, {
      activeManagerStatus: 'transferred'
    }, { new: true });
    
    console.log('Old manager updated:', oldManagerUpdate);
    
    console.log('Updating new manager status to active');
    
    // Update new manager status
    const newManagerUpdate = await User.findByIdAndUpdate(transfer.newManager, {
      activeManagerStatus: 'active'
    }, { new: true });
    
    console.log('New manager updated:', newManagerUpdate);
    
    res.status(200).json({
      message: 'Transfer accepted successfully',
      error: false,
      success: true,
      data: transfer
    });
  } catch (err) {
    console.error('Error in acceptTransfer:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = acceptTransferController;