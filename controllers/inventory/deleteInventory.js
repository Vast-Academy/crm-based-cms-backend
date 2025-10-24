const Item = require('../../models/inventoryModel');

const deleteInventory =  async (req, res) => {
    try {
      // Admin can delete all items, Manager can only delete services
      if (req.userRole !== 'admin' && req.userRole !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only admin and manager can delete items.'
        });
      }

      // Find item first to check type
      const item = await Item.findOne({ id: req.params.id });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // If manager, only allow service deletion
      if (req.userRole === 'manager' && item.type !== 'service') {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Managers can only delete services.'
        });
      }

      await Item.findOneAndDelete({ id: req.params.id });

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