const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    let token = req.cookies.token;
   
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
   
    if (!token) {
      return res.status(401).json({
        message: 'Not authenticated. Please log in.',
        error: true,
        success: false
      });
    }
   
    // Verify token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

    console.log('Secret key exists:', !!process.env.TOKEN_SECRET_KEY);
// Don't log the actual secret in production, just check if it exists
   
    // Find user
    const user = await User.findById(decoded.userId);
   
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }
   
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        message: 'Your account is inactive',
        error: true,
        success: false
      });
    }
   
    // Set user info on request
    req.userId = user._id;
    req.userRole = user.role;
    req.user = user;
   
    // Important: Add user's branch to the request
    // This will be used to restrict manager actions to their own branch
    if (user.branch) {
      req.userBranch = user.branch;
    }
   
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      message: 'Authentication failed',
      error: true,
      success: false
    });
  }
};
module.exports = authMiddleware;