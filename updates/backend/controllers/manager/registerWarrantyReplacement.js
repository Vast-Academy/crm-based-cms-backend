const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const WarrantyReplacement = require('../../models/warrantyReplacementModel');

const registerWarrantyReplacement = async (req, res) => {
    try {
      const { 
        serialNumber,
        customerName,
        customerPhone, 
        workOrderId, 
        issueDescription,
        issueCheckedBy    
      } = req.body;
      
      if (!serialNumber || !workOrderId || !issueDescription || !issueCheckedBy) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Verify the serial number is under warranty
      // Find the inventory item with this serial number
      const techInventory = await TechnicianInventory.findOne({
        'serializedItems.serialNumber': serialNumber,
        'serializedItems.status': 'used'
      })
      .populate('item', 'name unit warranty mrp salePrice')
      .lean();
      
      if (!techInventory) {
        return res.status(404).json({
          success: false,
          message: 'Serial number not found'
        });
      }
      
      // Find the customer by phone number instead of ID
    const customer = customerPhone 
    ? await Customer.findOne({ phoneNumber: customerPhone }).select('_id name').lean()
    : null;
    
  // If no customer found but name provided, try to find by work order
  let customerId = customer?._id;
  if (!customerId) {
    // Try to find through the workOrder
    const customerWithOrder = await Customer.findOne({
      'workOrders.orderId': workOrderId
    }).select('_id').lean();
    
    if (customerWithOrder) {
      customerId = customerWithOrder._id;
    }
  }
  
  if (!customerId) {
    return res.status(404).json({
      success: false,
      message: 'Could not find customer information'
    });
  }
  
  // Create warranty replacement record
  const warrantyReplacement = new WarrantyReplacement({
    serialNumber,
    productName: techInventory.item.name,
    customerId: customerId,
    customerName: customerName || customer?.name || 'Unknown Customer',
    originalWorkOrderId: workOrderId,
    issues: [{  // Add first issue to the issues array
      issueDescription,
      issueCheckedBy,
      reportedAt: new Date()
    }],
    registeredBy: req.user._id
  });
  
  await warrantyReplacement.save();
  
  return res.status(201).json({
    success: true,
    message: 'Warranty replacement registered successfully',
    data: warrantyReplacement
  });
  
} catch (error) {
  console.error('Error registering warranty replacement:', error);
  return res.status(500).json({
    success: false,
    message: 'Server error. Please try again later.'
  });
}
};

module.exports = registerWarrantyReplacement;  