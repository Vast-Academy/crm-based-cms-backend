const User = require('../../models/userModel');
const Customer = require('../../models/customerModel');

const getTechnicianProjects = async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    // Check if technician exists
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }
    
    // Find all customers with work orders assigned to this technician
    const customers = await Customer.find({
      'workOrders.technician': technicianId
    }).select('name phoneNumber workOrders');
    
    // Extract and flatten all work orders assigned to this technician
    const projects = [];
    
    customers.forEach(customer => {
      customer.workOrders.forEach(order => {
        if (order.technician && order.technician.toString() === technicianId) {
          projects.push({
            customerId: customer._id,
            customerName: customer.name,
            customerPhone: customer.phoneNumber,
            orderId: order.orderId,
            projectId: order.projectId,
            projectType: order.projectType,
            projectCategory: order.projectCategory,
            status: order.status,
            statusHistory: order.statusHistory,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            assignedAt: order.assignedAt,
            billingInfo: order.billingInfo,
            completedAt: order.statusHistory ? 
              order.statusHistory.find(h => h.status === 'completed' || h.status === 'pending-approval')?.updatedAt : 
              null
          });
        }
      });
    });
    
    // Sort by updatedAt in descending order (newest first)
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (err) {
    console.error('Error fetching technician projects:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching technician projects'
    });
  }
};

module.exports = getTechnicianProjects;