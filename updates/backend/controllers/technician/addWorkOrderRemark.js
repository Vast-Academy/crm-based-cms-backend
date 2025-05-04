// addWorkOrderRemark.js
const Customer = require('../../models/customerModel');

const addWorkOrderRemark = async (req, res) => {
  try {
    const { customerId, orderId, remark, activityType } = req.body;
    
    if (!remark) {
      return res.status(400).json({
        success: false,
        message: 'Remark is required'
      });
    }
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find the work order
    const workOrder = customer.workOrders.find(order => order.orderId === orderId);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }
    
    // Check if technician is assigned to this work order
    if (!workOrder.technician || workOrder.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this work order'
      });
    }
    
    // Add the remark to statusHistory
    if (!workOrder.statusHistory) {
      workOrder.statusHistory = [];
    }
    
    // Determine the status type (remark or communication)
    const statusType = activityType === 'communication' ? 'communication' : 'remark';
    
    workOrder.statusHistory.push({
      status: statusType,
      remark: remark,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    // Update the work order's updatedAt field
    workOrder.updatedAt = new Date();
    
    // Save the customer document
    await customer.save();
    
    res.json({
      success: true,
      message: 'Remark added successfully',
      data: {
        statusHistory: workOrder.statusHistory
      }
    });
  } catch (err) {
    console.error('Error adding remark:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while adding remark'
    });
  }
};

module.exports = addWorkOrderRemark;