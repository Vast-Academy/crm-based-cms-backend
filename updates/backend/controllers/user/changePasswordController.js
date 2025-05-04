const User = require('../../models/userModel');

const changePasswordController = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    console.log('Password change request:', { userId, bodyReceived: req.body });
   
    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
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
   
    // Check permissions - users can only change their own password
    if (userId !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own password'
      });
    }
   
    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
   
    // Update password - यूजर मॉडल में pre-save हुक पासवर्ड को हैश करेगा
    user.password = newPassword;
    await user.save();

    // सत्यापन के लिए सही पासवर्ड से लॉगिन कर सकते हैं या नहीं
    const canLogin = await user.matchPassword(newPassword);
    console.log('Can login with new password:', canLogin);
   
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

module.exports = changePasswordController;