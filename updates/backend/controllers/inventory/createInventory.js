const Item = require('../../models/inventoryModel');
const createInventory = async (req, res) => {
  try {
    // Only admin can create inventory items
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only admin can add inventory items.'
      });
    }
    
    const {
      id,
      type,
      name,
      unit,
      warranty,
      mrp,
      purchasePrice,
      salePrice
    } = req.body;
   
    // Check if item with same ID already exists
    const existingItemWithId = await Item.findOne({ id });
    if (existingItemWithId) {
      return res.status(400).json({
        success: false,
        message: 'Item with this ID already exists'
      });
    }
   
    // Check if item with same name already exists
    const existingItemWithName = await Item.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
   
    if (existingItemWithName) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
   
    // Create the new item object based on type
    // Admin creates items without branch assignment
    let newItemData = {
      id,
      type,
      name,
      salePrice,
    };
   
    // Add additional fields for product types only
    if (type === 'serialized-product' || type === 'generic-product') {
      newItemData.unit = unit;
      newItemData.warranty = warranty;
      newItemData.mrp = mrp;
      newItemData.purchasePrice = purchasePrice;
    }
   
    const newItem = new Item(newItemData);
    await newItem.save();
   
    res.json({
      success: true,
      item: newItem
    });
  } catch (err) {
    console.error('Error adding inventory item:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};
module.exports = createInventory;