// resetAdminPassword.js
const mongoose = require('mongoose');
const User = require('./models/userModel'); // Adjust path as needed
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find admin user
    const admin = await User.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    
    // Set new password - this will trigger the pre-save hook to hash it
    const newPassword = 'admin123'; // Change this to your desired password
    admin.password = newPassword;
    
    // Save user with new password
    await admin.save();
    
    console.log('Admin password reset successfully');
    console.log('New login credentials:');
    console.log('- Username: admin');
    console.log('- Password:', newPassword);
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  }
};

resetAdminPassword();