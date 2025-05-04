const User = require('../../models/userModel');

const addAdminUserController = async (req, res) => {
    try {
      // Check if user is admin
      if (req.userRole !== 'admin') {
        return res.status(403).json({
          message: 'Permission denied',
          error: true,
          success: false
        });
      }
      
      const { firstName, lastName, username, email, password, phone, location } = req.body;
      
      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Username or email already exists',
          error: true,
          success: false
        });
      }
      
      // Create new admin user
      const newAdmin = new User({
        firstName,
        lastName,
        username,
        email,
        password,
        phone,
        role: 'admin',
        location
      });
      
      await newAdmin.save();
      
      // Remove password from response
      const adminData = newAdmin.toObject();
      delete adminData.password;
      
      res.status(201).json({
        message: 'Admin user added successfully',
        error: false,
        success: true,
        data: adminData
      });
    } catch (err) {
      console.error('Error in addAdminUser:', err);
      res.status(500).json({
        message: err.message || 'Server error',
        error: true,
        success: false
      });
    }
  };

module.exports = addAdminUserController;  