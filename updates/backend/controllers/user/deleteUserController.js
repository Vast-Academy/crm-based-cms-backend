const User = require('../../models/userModel');

const deleteUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user to delete
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return res.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }
    
    // Check permissions
    if (req.userRole === 'admin') {
      // Admin can delete any user except themselves
      if (userToDelete._id.toString() === req.userId.toString()) {
        return res.status(400).json({
          message: 'Cannot delete your own account',
          error: true,
          success: false
        });
      }
    } else if (req.userRole === 'manager') {
      // Manager can only delete technicians in their branch
      if (userToDelete.role !== 'technician') {
        return res.status(403).json({
          message: 'You can only delete technicians',
          error: true,
          success: false
        });
      }
      
      if (userToDelete.branch.toString() !== req.userBranch.toString()) {
        return res.status(403).json({
          message: 'You can only delete technicians from your branch',
          error: true,
          success: false
        });
      }
    } else {
      // Other roles cannot delete users
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      message: 'User deleted successfully',
      error: false,
      success: true
    });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = deleteUserController;