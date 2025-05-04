const Branch = require('../../models/branchModel');

const addBranchController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const { name, location, address, phone } = req.body;
      
      // Check if branch name already exists
      const existingBranch = await Branch.findOne({ name });
      if (existingBranch) {
        return res.status(400).json({
          message: 'Branch with this name already exists',
          error: true,
          success: false
        });
      }
      
      // Create new branch
      const newBranch = new Branch({
        name,
        location,
        address,
        phone,
        createdBy: req.userId
      });
      
      await newBranch.save();
      
      res.status(201).json({
        message: 'Branch added successfully',
        error: false,
        success: true,
        data: newBranch
      });
    } catch (err) {
      console.error('Error in addBranch:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };

  
 module.exports = addBranchController; 