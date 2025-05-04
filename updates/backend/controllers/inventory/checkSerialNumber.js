const Item = require('../../models/inventoryModel');
const checkSerialNumber = async (req, res) => {
    try {
      const { serialNumber } = req.params;
      
      // We need to check if the user is a manager and filter by branch
      let query = { 'stock.serialNumber': serialNumber };
      
      // If the user is a manager, add branch filter
      if (req.userRole === 'manager' && req.userBranch) {
        // Find items where serial number exists AND is in manager's branch
        query = {
          'stock': {
            $elemMatch: {
              'serialNumber': serialNumber,
              'branch': req.userBranch // Only check in manager's branch
            }
          }
        };
      }
      
      // Check if serial number exists with the appropriate query
      const existingItem = await Item.findOne(query);
      
      if (existingItem) {
        return res.json({
          exists: true,
          item: {
            id: existingItem.id,
            name: existingItem.name
          }
        });
      }
      
      // If manager and not found in their branch, we can check if it exists elsewhere
      if (req.userRole === 'manager' && req.userBranch) {
        const anyBranchItem = await Item.findOne({
          'stock.serialNumber': serialNumber
        });
        
        if (anyBranchItem) {
          return res.json({
            exists: false,
            message: 'Serial number exists but not in your branch'
          });
        }
      }
      
      res.json({
        exists: false,
        message: 'Serial number not found in inventory'
      });
    } catch (err) {
      console.error('Error checking serial number:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
};
module.exports = checkSerialNumber;