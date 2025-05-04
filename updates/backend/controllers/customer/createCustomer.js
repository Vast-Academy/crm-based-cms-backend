const Customer = require('../../models/customerModel');
const generateOrderId = require('../../helpers/generateOrderId');

const createCustomer = async (req, res) => {
  try {
    const { projectType, initialRemark } = req.body;
   
    // Check if project type is provided
    if (!projectType) {
      return res.status(400).json({
        success: false,
        message: 'Project type is required'
      });
    }
   
    // Check if phone number already exists
    const existingCustomer = await Customer.findOne({
      phoneNumber: req.body.phoneNumber
    });
   
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists'
      });
    }
   
    // Set branch based on user role
    let branch = req.body.branch;
    if (req.user.role !== 'admin') {
      branch = req.user.branch;
    }
   
    // Generate project ID and order ID
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const orderId = await generateOrderId();
    
    // Create new customer with project and work order
    const customer = await Customer.create({
      ...req.body,
      branch,
      projectType: projectType,
      projects: [{
        projectId,
        projectType,
        initialRemark,
        createdAt: new Date()
      }],
      workOrders: [{
        orderId,
        projectId,
        projectType,
        status: 'pending',
        initialRemark,
        createdAt: new Date()
      }],
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
   
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating customer'
    });
  }
};

module.exports = createCustomer;