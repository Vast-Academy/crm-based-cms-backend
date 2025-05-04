const Customer = require('../../models/customerModel');
const User = require('../../models/userModel'); // Add this import

const getAllWorkOrders = async (req, res) => {
    try {
      // Filter options
      const filter = {};
      // if (req.query.status) {
      //   filter['workOrders.status'] = req.query.status;
      // }
     
      // Branch access control
      if (req.user.role !== 'admin') {
        filter.branch = req.user.branch;
      } else if (req.query.branch) {
        filter.branch = req.query.branch;
      }
     
      // Get customers with work orders
      const customers = await Customer.find(filter)
        .populate('branch', 'name')
        .populate('workOrders.technician', 'firstName lastName')
        .populate('workOrders.assignedBy', 'firstName lastName')
        .populate('projects.completedBy', 'firstName lastName phone'); // Add this populate
     
      // Extract all work orders with customer info
      const workOrders = [];
      
      for (const customer of customers) {
        for (const order of customer.workOrders) {
          // Create the basic order object with all fields
          const orderObj = {
            ...order.toObject(),
            customerName: customer.name,
            customerPhone: customer.phoneNumber,
            customerEmail: customer.email,
            branchName: customer.branch ? customer.branch.name : null,
            customerId: customer._id,
            initialRemark: order.initialRemark,
            statusHistory: order.statusHistory || []
          };
          
          // Find the matching project
          const matchingProject = customer.projects.find(p => p.projectId === order.projectId);
          
          // Set project category and creation date
          if (matchingProject) {
            orderObj.projectCategory = matchingProject.projectCategory || order.projectCategory || 'New Installation';
            orderObj.projectCreatedAt = matchingProject.createdAt;
            
            // Add original technician info for repair work orders
            if ((orderObj.projectCategory === 'Repair' || matchingProject.projectCategory === 'Repair') && 
                matchingProject.completedBy) {
              
              orderObj.originalTechnician = {
                firstName: matchingProject.completedBy.firstName || '',
                lastName: matchingProject.completedBy.lastName || '',
                phoneNumber: matchingProject.completedBy.phone || ''
              };
            }
          } else {
            // Default values if no matching project
            orderObj.projectCategory = order.projectCategory || 'New Installation';
          }
          
          workOrders.push(orderObj);
        }
      }
     
      // Sort by creation date (newest first)
      workOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
     
      res.status(200).json({
        success: true,
        count: workOrders.length,
        data: workOrders
      });
    } catch (err) {
      console.error('Error fetching work orders:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching work orders'
      });
    }
  };
module.exports = getAllWorkOrders;