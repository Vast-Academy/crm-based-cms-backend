const Item = require('../../models/inventoryModel');
const getInventoryByType = async (req, res) => {
  try {
    const { type } = req.params; // 'serialized-product', 'generic-product', or 'service'
    const { branch } = req.query; // Optional branch parameter
     
    // Validate type
    if (!['serialized-product', 'generic-product', 'service'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory type'
      });
    }
     
    // Get all items of requested type
    const items = await Item.find({ type })
      .populate('branch', 'name location')
      .sort('-createdAt');
   
    // Process items based on user role
    const processedItems = items.map(item => {
      const itemObj = item.toObject();

      // Calculate totalStock across all branches (for admin)
  if (req.userRole === 'admin') {
    // For serialized products, count total items
    if (itemObj.type === 'serialized-product') {
      itemObj.totalStock = itemObj.stock ? itemObj.stock.length : 0;
    } 
    // For generic products, sum up quantities
    else if (itemObj.type === 'generic-product') {
      itemObj.totalStock = itemObj.stock ? itemObj.stock.reduce((total, stockItem) => 
        total + parseInt(stockItem.quantity, 10), 0) : 0;
    }
  }
     
      // If user is manager
      if (req.userRole === 'manager') {
        // 1. Remove purchase price - managers shouldn't see this
        delete itemObj.purchasePrice;
       
        // 2. Filter stock to only show entries for manager's branch
        if (itemObj.stock && itemObj.stock.length > 0) {
          itemObj.stock = itemObj.stock.filter(
            stockItem => stockItem.branch &&
            stockItem.branch.toString() === req.userBranch.toString()
          );
        }
      }
      // If user is admin AND branch parameter is provided, filter stock by branch
      else if (req.userRole === 'admin' && branch) {
        if (itemObj.stock && itemObj.stock.length > 0) {
          itemObj.stock = itemObj.stock.filter(
            stockItem => stockItem.branch &&
            stockItem.branch.toString() === branch
          );
        }
      }
      // Admin without branch parameter can see all stock
     
      return itemObj;
    });
     
    res.json({
      success: true,
      items: processedItems
    });
  } catch (err) {
    console.error(`Error fetching ${req.params.type} items:`, err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};
module.exports = getInventoryByType;