const Customer = require('../../models/customerModel');
const generateOrderId = require('../../helpers/generateOrderId');

const createCustomer = async (req, res) => {
  try {
    const { projectType, initialRemark, isExistingCustomer, completionDate, installedBy } = req.body;
   
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
   
    // Generate project ID
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    
    // Prepare customer data
    const customerData = {
      ...req.body,
      branch,
      projectType: projectType,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    // Set customer status if provided
    if (req.body.customerStatus) {
      customerData.customerStatus = req.body.customerStatus;
    }

    if (isExistingCustomer) {
      // For existing customers, create completed project without work order
      customerData.projects = [{
        projectId,
        projectType,
        initialRemark,
        installedBy,
        completionDate: new Date(completionDate),
        status: 'completed',
        createdAt: new Date(completionDate)
      }];
      customerData.workOrders = []; // No work order for existing customers
    } else {
      // For new customers, create project and work order as before
      const orderId = await generateOrderId();
      
      customerData.projects = [{
        projectId,
        projectType,
        initialRemark,
        createdAt: new Date()
      }];
      customerData.workOrders = [{
        orderId,
        projectId,
        projectType,
        status: 'pending',
        initialRemark,
        createdAt: new Date()
      }];
    }
    
    // Create new customer
    const customer = await Customer.create(customerData);
   
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