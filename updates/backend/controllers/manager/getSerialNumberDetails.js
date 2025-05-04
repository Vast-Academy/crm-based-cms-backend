const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');

// Get serial number details for warranty check
const getSerialNumberDetails = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }
    
    // Find the inventory item with this serial number
    const techInventory = await TechnicianInventory.findOne({
      'serializedItems.serialNumber': serialNumber
    })
    .populate('item', 'name unit warranty mrp salePrice')
    .populate('technician', 'firstName lastName')
    .lean();
    
    if (!techInventory) {
      return res.status(404).json({
        success: false,
        message: 'Serial number not found'
      });
    }
    
    // Get the specific serial item
    const serialItem = techInventory.serializedItems.find(
      item => item.serialNumber === serialNumber
    );
    
    if (!serialItem) {
      return res.status(404).json({
        success: false,
        message: 'Serial number data inconsistency'
      });
    }
    
    // If serial item doesn't have work order ID or isn't used
    if (serialItem.status !== 'used' || !serialItem.usedInWorkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Serial number found but not associated with any work order'
      });
    }
    
    // Find the customer with this work order
    const customer = await Customer.findOne({
      'workOrders.orderId': serialItem.usedInWorkOrder
    })
    .select('name phoneNumber workOrders')
    .lean();
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer information not found'
      });
    }
    
    // Find the specific work order
    const workOrder = customer.workOrders.find(
      wo => wo.orderId === serialItem.usedInWorkOrder
    );
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order information not found'
      });
    }
    
    // Format the response data
    const result = {
      serialNumber,
      productName: techInventory.item.name,
      warranty: techInventory.item.warranty,
      price: techInventory.item.salePrice,
      installationDate: serialItem.usedAt || workOrder.updatedAt,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      technicianName: `${techInventory.technician.firstName} ${techInventory.technician.lastName}`,
      workOrderId: workOrder.orderId,
      projectType: workOrder.projectType
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getSerialNumberDetails:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = getSerialNumberDetails;