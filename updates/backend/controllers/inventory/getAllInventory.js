const Item = require('../../models/inventoryModel');

const getAllInventory = async (req, res) => {
  try {
    // Create query object - will be used to filter results
    let query = {};
    
    // If user is manager, only show items from their branch
    if (req.userRole === 'manager' && req.userBranch) {
      query.branch = req.userBranch;
    }
    
    // Fetch items based on the query (filtered for managers, all for admins)
    const items = await Item.find(query)
      .populate('branch', 'name location') // Populate branch details
      .sort('-createdAt');
    
    res.json({
      success: true,
      items
    });
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = getAllInventory;