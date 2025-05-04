const User = require('../../models/userModel');

const updateUserStatusController = async (req, res) => {
  try {
    // Check if user has permission to update status
    // Admins can update any user, managers can only update technicians
    if (req.userRole !== 'admin' && 
        (req.userRole !== 'manager' || req.body.userRole !== 'technician')) {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    const { userId, status } = req.body;
    
    // Validate status value
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({
        message: 'Invalid status value',
        error: true,
        success: false
      });
    }
    
    // Find and update the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }
    
    // If a manager is trying to update an admin or another manager, deny permission
    if (req.userRole === 'manager' && (user.role === 'admin' || user.role === 'manager')) {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    // Update the status
    user.status = status;
    await user.save();
    
    res.status(200).json({
      message: `User status updated to ${status}`,
      error: false,
      success: true,
      data: {
        _id: user._id,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error in updateUserStatus:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = updateUserStatusController;