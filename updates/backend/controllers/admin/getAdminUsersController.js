const User = require('../../models/userModel');

const getAdminUsersController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const adminUsers = await User.find({ role: 'admin' })
        .select('-password')
        .sort('-createdAt');
      
      res.status(200).json({
        message: 'Admin users fetched successfully',
        error: false,
        success: true,
        data: adminUsers
      });
    } catch (err) {
      console.error('Error in getAdminUsers:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };

module.exports = getAdminUsersController;  