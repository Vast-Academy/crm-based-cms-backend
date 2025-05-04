const User = require('../../models/userModel');

const getManagersController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const managers = await User.find({ role: 'manager' })
        .select('-password')
        .populate('branch', 'name location')
        .sort('-createdAt');
      
      res.status(200).json({
        message: 'Managers fetched successfully',
        error: false,
        success: true,
        data: managers
      });
    } catch (err) {
      console.error('Error in getManagers:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };

module.exports = getManagersController;  