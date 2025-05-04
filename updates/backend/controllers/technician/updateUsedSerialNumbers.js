const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');

const updateSerialNumberStatus = async (req, res) => {
  try {
    const { serialNumbers, workOrderId, customerId } = req.body;
    
    if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Serial numbers are required'
      });
    }
    
    if (!workOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Work order ID is required'
      });
    }
    
    // Update serial numbers in technician inventory
    for (const serialNumber of serialNumbers) {
      await TechnicianInventory.updateOne(
        { 'serializedItems.serialNumber': serialNumber },
        {
          $set: {
            'serializedItems.$.status': 'used',
            'serializedItems.$.usedInWorkOrder': workOrderId,
            'serializedItems.$.usedAt': new Date()
          }
        }
      );
    }
    
    return res.status(200).json({
      success: true,
      message: 'Serial numbers updated successfully'
    });
  } catch (error) {
    console.error('Error updating serial number status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

 module.exports = updateSerialNumberStatus; 