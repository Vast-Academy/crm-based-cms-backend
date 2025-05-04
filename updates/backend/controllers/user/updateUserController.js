const User = require('../../models/userModel');

const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Find the user to update
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check permissions
    if (req.userRole === 'admin') {
      // Admin can update any user
      console.log('Admin update access granted');
    } else if (req.userRole === 'manager') {
      // Manager can update technicians in their branch OR themselves
      if (userToUpdate._id.toString() === req.userId.toString()) {
        // Manager updating themselves - allow
        console.log('Manager updating own profile - access granted');
        
        // Don't allow managers to change their branch when updating themselves
        delete updates.branch;
      } else if (userToUpdate.role !== 'technician') {
        return res.status(403).json({
          success: false,
          message: 'You can only update technicians or your own profile'
        });
      } else {
        // Manager updating a technician - check branch
        if (!userToUpdate.branch) {
          return res.status(403).json({
            success: false,
            message: 'Cannot update technician with no branch assigned'
          });
        }
        
        const technicianBranchId = userToUpdate.branch.toString();
        const managerBranchId = req.userBranch.toString();
        
        if (technicianBranchId !== managerBranchId) {
          return res.status(403).json({
            success: false,
            message: 'You can only update technicians from your branch'
          });
        }
        
        // Always use manager's branch when updating technicians
        updates.branch = req.userBranch;
      }
    } else if (req.userRole === 'technician') {
      // Technicians can only update themselves
      if (userToUpdate._id.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }
      
      // Technicians can't change their branch
      delete updates.branch;
      
      console.log('Technician self-update access granted');
    } else {
      // Other roles cannot update users
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }
    
    // Don't allow changing role
    delete updates.role;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

module.exports = updateUserController;