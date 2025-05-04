const Customer = require('../../models/customerModel');

const updateWorkOrderStatus = async (req, res) => {
  try {
    // Only technicians can update their work orders
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can update their work orders.'
      });
    }
    
    const { customerId, orderId, status, remark } = req.body;
    
    // Validate status value
    if (!['assigned', 'in-progress', 'paused', 'pending-approval', 'completed', 'transferring', 'transferred'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // If transitioning to in-progress, check if there's already an active project
    if (status === 'in-progress') {
      // Find any existing in-progress work orders
      const activeCustomers = await Customer.find({
        'workOrders': {
          $elemMatch: {
            'technician': req.user._id,
            'status': 'in-progress',
            'orderId': { $ne: orderId } // Not the current work order
          }
        }
      });
      
      // If another active project is found, don't allow starting a new one
      if (activeCustomers.length > 0) {
        let activeOrderInfo = null;
        
        // Find the active order
        for (const customer of activeCustomers) {
          const activeOrder = customer.workOrders.find(
            order => order.technician && 
                    order.technician.toString() === req.user._id.toString() && 
                    order.status === 'in-progress'
          );
          
          if (activeOrder) {
            activeOrderInfo = {
              projectType: activeOrder.projectType,
              orderId: activeOrder.orderId
            };
            break;
          }
        }
        
        return res.status(400).json({
          success: false,
          message: `You already have an active project: ${activeOrderInfo.projectType} (${activeOrderInfo.orderId}). Please pause it before starting a new one.`
        });
      }
    }
    
    // Find the customer and update the work order
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
    
    // Add entry to status history
    if (!workOrder.statusHistory) {
      workOrder.statusHistory = [];
    }
    
    workOrder.statusHistory.push({
      status,
      remark,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    // Update the status
    workOrder.status = status;
    workOrder.updatedAt = new Date();
    
    // If starting a project, set the active timestamp
    if (status === 'in-progress') {
      workOrder.activeTimestamp = new Date();
    }
    
    await customer.save();
    
    // Format the updated work order for response
    const updatedWorkOrder = {
      ...workOrder.toObject(),
      customerId: customer._id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phoneNumber
    };
    
    res.status(200).json({
      success: true,
      message: `Work order status updated to ${status}`,
      data: updatedWorkOrder
    });
  } catch (err) {
    console.error('Error updating work order status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while updating work order status'
    });
  }
};

module.exports = updateWorkOrderStatus;