const Item = require('../../models/inventoryModel');

const getInventory = async (req, res) => {
    try {
      const item = await Item.findOne({ id: req.params.id });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      res.json({
        success: true,
        item
      });
    } catch (err) {
      console.error('Error fetching inventory item:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
};

module.exports = getInventory;