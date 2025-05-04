const Customer = require('../../models/customerModel');

const getTechnicianActiveProject = async (req, res) => {
  try {
    // Only technicians can access this
    if (req.user.role !== 'technician') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only technicians can check active projects.'
      });
    }
    
    // Find customers with work orders assigned to this technician that are in-progress
    const customers = await Customer.find({
      'workOrders': {
        $elemMatch: {
          'technician': req.user._id,
          'status': 'in-progress'
        }
      }
    })
    .populate('branch', 'name location');
    
    // Extract active work order if any
    let activeProject = null;
    let hasActiveProject = false;
    
    if (customers.length > 0) {
      for (const customer of customers) {
        const activeOrder = customer.workOrders.find(
          order => order.technician && 
                  order.technician.toString() === req.user._id.toString() && 
                  order.status === 'in-progress'
        );
        
        if (activeOrder) {
          hasActiveProject = true;
          activeProject = {
            ...activeOrder.toObject(),
            customerId: customer._id,
            customerName: customer.name,
            projectType: activeOrder.projectType,
            orderId: activeOrder.orderId
          };
          break;
        }
      }
    }
    
    res.status(200).json({
      success: true,
      hasActiveProject,
      activeProject
    });
  } catch (err) {
    console.error('Error checking active project:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while checking active project'
    });
  }
};

module.exports = getTechnicianActiveProject;