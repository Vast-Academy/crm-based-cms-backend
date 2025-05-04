const mongoose = require('mongoose');
const ReturnedInventory = require('../../models/returnedInventoryModel');
const Item = require('../../models/inventoryModel');
const TransferHistory = require('../../models/transferHistoryModel');

const confirmReturnedInventory = async (req, res) => {
  try {
    // Only managers can confirm returned inventory
    if (req.userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only managers can confirm returned inventory.'
      });
    }
    
    const { returnId } = req.params;
    
    // Find the returned inventory entry
    const returnEntry = await ReturnedInventory.findOne({
      _id: returnId,
      branch: req.userBranch,
      status: 'pending'
    }).populate('items.item');
    
    if (!returnEntry) {
      return res.status(404).json({
        success: false,
        message: 'Returned inventory entry not found or already processed'
      });
    }
    
    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Process each returned item
      for (const returnedItem of returnEntry.items) {
        const item = await Item.findById(returnedItem.item._id).session(session);
        
        if (!item) {
          throw new Error(`Item not found: ${returnedItem.item._id}`);
        }
        
        // Add back to main inventory
        if (returnedItem.type === 'serialized-product') {
          // For serialized product
          item.stock.push({
            serialNumber: returnedItem.serialNumber,
            quantity: 1,
            date: new Date(),
            branch: req.userBranch
          });
        } else {
          // For generic product
          item.stock.push({
            quantity: returnedItem.quantity,
            date: new Date(),
            branch: req.userBranch
          });
        }
        
        await item.save({ session });
        
        // Create transfer history record
        await new TransferHistory({
          fromType: 'technician',
          fromId: returnEntry.technician,
          toType: 'branch',
          toId: req.userBranch,
          item: item._id,
          serialNumber: returnedItem.serialNumber || undefined,
          quantity: returnedItem.quantity,
          transferredBy: req.userId,
          transferredAt: new Date()
        }).save({ session });
      }
      
      // Update the returned inventory entry
      returnEntry.status = 'confirmed';
      returnEntry.confirmedAt = new Date();
      returnEntry.confirmedBy = req.userId;
      await returnEntry.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.json({
        success: true,
        message: 'Returned inventory confirmed successfully',
        data: {
          id: returnEntry._id,
          status: returnEntry.status,
          confirmedAt: returnEntry.confirmedAt
        }
      });
    } catch (err) {
      // Abort transaction on error
      await session.abortTransaction();
      throw err;
    } finally {
      // End session
      session.endSession();
    }
  } catch (err) {
    console.error('Error confirming returned inventory:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = confirmReturnedInventory;