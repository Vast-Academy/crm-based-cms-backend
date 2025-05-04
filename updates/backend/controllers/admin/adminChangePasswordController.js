const User = require('../../models/userModel');

const adminChangePasswordController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    // Validate request
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if admin
    if (req.userRole === 'admin') {
      // Admin can update any technician
    } else if (req.userRole === 'manager') {
      // Manager can only update technicians in their branch
      const technician = await User.findById(userId);
      if (!technician || technician.branch.toString() !== req.userBranch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update technicians in your branch'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Update password directly - pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error in adminChangePassword:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

module.exports = adminChangePasswordController;