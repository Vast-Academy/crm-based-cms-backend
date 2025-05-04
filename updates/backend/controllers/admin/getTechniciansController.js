const User = require('../../models/userModel');

// Get all technicians
const getTechniciansController = async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
    
    const technicians = await User.find({ role: 'technician' })
      .select('-password')
      .populate('branch', 'name location')
      .sort('-createdAt');
    
    res.status(200).json({
      message: 'Technicians fetched successfully',
      error: false,
      success: true,
      data: technicians
    });
  } catch (err) {
    console.error('Error in getTechnicians:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getTechniciansController;