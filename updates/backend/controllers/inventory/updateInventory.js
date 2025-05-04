const Item = require('../../models/inventoryModel');

// Check if your updateInventory controller is properly updating all fields
const updateInventory = async (req, res) => {
  try {
    const { type, name, unit, warranty, mrp, purchasePrice, salePrice } = req.body;
    
    // Find the item
    const item = await Item.findOne({ id: req.params.id });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Update fields - make sure all fields are properly updated
    if (type) item.type = type;
    if (name) item.name = name;
    
    // For products
    if (type === 'serialized-product' || type === 'generic-product' || 
        item.type === 'serialized-product' || item.type === 'generic-product') {
      if (unit) item.unit = unit;
      if (warranty) item.warranty = warranty;
      if (mrp !== undefined) item.mrp = mrp; // Use !== undefined to accept 0 values
      if (purchasePrice !== undefined) item.purchasePrice = purchasePrice;
    }
    
    if (salePrice !== undefined) item.salePrice = salePrice;
    item.updatedAt = new Date();
    
    await item.save();
    
    res.json({
      success: true,
      item: item  // Return the updated item
    });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = updateInventory;  