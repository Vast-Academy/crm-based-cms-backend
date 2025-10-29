// controllers/technician/returnInventoryToManager.js
const mongoose = require('mongoose');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const Item = require('../../models/inventoryModel');
const ReturnedInventory = require('../../models/returnedInventoryModel');

const returnInventoryToManager = async (req, res) => {
  try {
    // Only technicians can return inventory
    if (req.userRole !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only technicians can return inventory.'
      });
    }
    
    const { type, itemId, serialNumber, quantity } = req.body;
    
    console.log("Return request received:", { type, itemId, serialNumber, quantity });
    
    // Find the item by its custom string ID
    const item = await Item.findOne({ id: itemId });
    
    if (!item) {
      const itemById = await Item.findById(itemId);
      if (itemById) {
        // If found by MongoDB ID instead
        item = itemById;
      } else {
        console.log("Item not found with ID:", itemId);
        return res.status(404).json({
          success: false,
          message: 'Item not found in inventory'
        });
      }
    }
    
    console.log("Found item:", item.name, "with MongoDB _id:", item._id);
    
    // Find the technician's inventory
    const techInventory = await TechnicianInventory.findOne({
      technician: req.userId,
      item: item._id
    });
    
    if (!techInventory) {
      console.log("Technician inventory not found for item:", item._id);
      return res.status(404).json({
        success: false,
        message: 'Item not found in your inventory'
      });
    }
    
    console.log("Found technician inventory:", techInventory._id);
    
    // Handle the return based on item type
    if (type === 'serialized-product') {
      // Find the serial number in technician's inventory
      const serialItemIndex = techInventory.serializedItems.findIndex(
        item => item.serialNumber === serialNumber && item.status === 'active'
      );
      
      if (serialItemIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'Serial number not found in your inventory or already used'
        });
      }
      
      console.log("Found serialized item at index:", serialItemIndex);
      
      // Update item status to "returned"
      techInventory.serializedItems[serialItemIndex].status = 'returned';

      // Create new returned inventory entry
      await createOrUpdateReturnedInventory(req.userId, req.userBranch, item._id, serialNumber, 1, type);
      
    } else {
      // For generic products
      if (!quantity || quantity <= 0 || quantity > techInventory.genericQuantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity. You have ${techInventory.genericQuantity} ${item.unit}(s).`
        });
      }
      
      console.log("Valid quantity for generic item:", quantity);
      
      // Reduce from technician's inventory
      techInventory.genericQuantity -= quantity;

      // Create new returned inventory entry
      await createOrUpdateReturnedInventory(req.userId, req.userBranch, item._id, null, quantity, type);
    }
    
    // Update last modified info
    techInventory.lastUpdated = new Date();
    techInventory.lastUpdatedBy = req.userId;
    
    // Save changes to technician inventory
    await techInventory.save();
    
    console.log("Return successful");
    res.json({
      success: true,
      message: 'Inventory returned successfully. Manager approval pending.',
      data: {
        itemId,
        type,
        quantity: type === 'serialized-product' ? 1 : quantity
      }
    });
  } catch (err) {
    console.error('Error returning inventory:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Helper function to create a new returned inventory entry
const createOrUpdateReturnedInventory = async (technicianId, branchId, itemId, serialNumber, quantity, type) => {
  try {
    // Always create a new return entry for each return request
    // This ensures each return action creates a separate entry with its own timestamp
    const returnEntry = new ReturnedInventory({
      technician: technicianId,
      branch: branchId,
      items: [{
        item: itemId,
        quantity,
        serialNumber,
        type
      }],
      returnedAt: new Date() // Explicitly set the return timestamp
    });

    await returnEntry.save();
    console.log('New return entry created:', returnEntry._id);
    return returnEntry;
  } catch (err) {
    console.error('Error creating returned inventory:', err);
    throw err;
  }
};

module.exports = returnInventoryToManager;