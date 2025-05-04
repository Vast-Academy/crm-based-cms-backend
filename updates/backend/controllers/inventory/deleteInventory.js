const Item = require('../../models/inventoryModel');

const deleteInventory =  async (req, res) => {
    try {
      const item = await Item.findOneAndDelete({ id: req.params.id });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

 module.exports = deleteInventory; 