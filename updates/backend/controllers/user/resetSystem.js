const mongoose = require('mongoose');
const User = require('../../models/userModel');

/**
 * Reset system to default state
 * Deletes all collections except for Users collection
 * Creates a default admin user
 */
const resetSystem = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin users can reset the system',
        error: true
      });
    }

    // Verify password from request body
    const { password } = req.body;
    
    if (!password || password !== 'bhopadi@123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid security password',
        error: true
      });
    }

    // Get all collections in the database
    const collections = await mongoose.connection.db.collections();
    
    // Loop through all collections and drop them
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        continue;
      }
      
      // Drop the collection
      if (collectionName !== 'users') {
        await mongoose.connection.db.dropCollection(collectionName);
      } else {
        // For users collection, delete all users
        await User.deleteMany({});
      }
    }
    
    // Create default admin user
    await User.create({
      firstName: "",
      lastName: "",
      username: 'admin',
      email: "",
      password: 'admin123', // This will be hashed by the pre-save hook,
      phone: "",
      role: 'admin',
      status: 'active'
    });
    
    return res.status(200).json({
      success: true,
      message: 'System reset to default state successfully',
      error: false
    });
    
  } catch (error) {
    console.error('Reset system error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting system: ' + error.message,
      error: true
    });
  }
};

module.exports = {resetSystem};