const Customer = require('../../models/customerModel');

const completeWorkOrder = async (req, res) => {
  try {
    // Only technicians can complete work orders
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can complete work orders.'
      });
    }
    
    const { customerId, orderId, remark = '' } = req.body;
    
    // Find the customer and work order
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find the specific work order
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
    
    // Only in-progress work orders can be completed
    if (workOrder.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a work order with status: ${workOrder.status}`
      });
    }
    
    // Update the work order status to completed
    workOrder.status = 'completed';
    
    // Add status history entry
    if (!workOrder.statusHistory) {
      workOrder.statusHistory = [];
    }
    
    workOrder.statusHistory.push({
      status: 'completed',
      remark: remark,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    // Update the completion timestamp
    workOrder.completedAt = new Date();
    workOrder.updatedAt = new Date();
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Work order completed successfully',
      data: workOrder
    });
  } catch (err) {
    console.error('Error completing work order:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while completing work order'
    });
  }
};

module.exports = completeWorkOrder;