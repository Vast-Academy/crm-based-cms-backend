const User = require('../../models/userModel');

const getManagerByIdController = async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    const { managerId } = req.params;
    
    // Find manager by ID
    const manager = await User.findOne({ 
      _id: managerId,
      role: 'manager'
    })
    .select('-password')
    .populate('branch', 'name location');
    
    if (!manager) {
      return res.status(404).json({
        message: 'Manager not found',
        error: true,
        success: false
      });
    }
    
    res.status(200).json({
      message: 'Manager fetched successfully',
      error: false,
      success: true,
      data: manager
    });
  } catch (err) {
    console.error('Error in getManagerById:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getManagerByIdController;