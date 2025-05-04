const User = require('../../models/userModel');

const getUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user with populated branch
    const user = await User.findById(userId)
      .select('-password')
      .populate('branch', 'name location');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // For debugging
    console.log('User found:', {
      userId,
      userRole: user.role,
      requestUserRole: req.userRole,
      branch: user.branch
    });
    
    // Check permissions
    // Check permissions
if (req.userRole === 'admin') {
  // Admin can view any user
  console.log('Admin access granted');
} else if (req.userRole === 'manager') {
  // Manager can view technicians in their branch OR themselves
  if (user._id.toString() === req.userId.toString()) {
    // Manager viewing themselves - allow
    console.log('Manager viewing own profile - access granted');
  } else if (user.role !== 'technician') {
    console.log('Access denied: Manager tried to view non-technician');
    return res.status(403).json({
      success: false,
      message: 'You can only view technicians or your own profile'
    });
  } else {
    // Manager viewing a technician - check branch
    const technicianBranchId = user.branch && user.branch._id
      ? user.branch._id.toString()
      : (user.branch ? user.branch.toString() : null);
    
    const managerBranchId = req.userBranch ? req.userBranch.toString() : null;
    
    if (!technicianBranchId) {
      console.log('Access denied: Technician has no branch');
      return res.status(403).json({
        success: false,
        message: 'Cannot edit technician with no branch assigned'
      });
    }
    
    if (technicianBranchId !== managerBranchId) {
      console.log('Access denied: Branch mismatch');
      return res.status(403).json({
        success: false,
        message: 'You can only view technicians from your branch'
      });
    }
    
    console.log('Manager access granted for technician');
  }
} else if (req.userRole === 'technician') {
  // Technicians can only view themselves
  if (user._id.toString() !== req.userId.toString()) {
    console.log('Access denied: Technician tried to view another user');
    return res.status(403).json({
      success: false,
      message: 'Permission denied'
    });
  }
  console.log('Technician self-view access granted');
} else {
  // Other roles can only view themselves
  if (user._id.toString() !== req.userId.toString()) {
    console.log('Access denied: User tried to view another user');
    return res.status(403).json({
      success: false,
      message: 'Permission denied'
    });
  }
  console.log('Self-view access granted');
}
    
    // If we get here, access is granted
    console.log('Sending user data in response');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error in getUser:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

module.exports = getUserController;