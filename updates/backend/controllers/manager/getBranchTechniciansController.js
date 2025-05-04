const User = require('../../models/userModel');

const getBranchTechniciansController = async (req, res) => {
  try {
    // Check if user is manager or admin
    if (req.userRole !== 'manager' && req.userRole !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied',
        error: true,
        success: false
      });
    }
   
    // Initialize query with role: technician
    let query = { role: 'technician' };
   
    // If branch parameter is provided in the request, filter by that branch
    if (req.query.branch) {
      query.branch = req.query.branch;
    }
    // If no branch parameter but user is manager, filter by manager's branch
    else if (req.userRole === 'manager') {
      query.branch = req.userBranch;
    }
    
    const technicians = await User.find(query)
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
    console.error('Error in getBranchTechnicians:', err);
    res.status(500).json({
      message: err.message || 'Server error',
      error: true,
      success: false
    });
  }
};

module.exports = getBranchTechniciansController;