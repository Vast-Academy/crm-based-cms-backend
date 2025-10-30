const Customer = require('../../models/customerModel');

const addOldProject = async (req, res) => {
  try {
    const { customerId, projectType, completionDate, installedBy, initialRemark } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    if (!projectType) {
      return res.status(400).json({
        success: false,
        message: 'Project type is required'
      });
    }

    if (!completionDate) {
      return res.status(400).json({
        success: false,
        message: 'Completion date is required'
      });
    }

    if (!installedBy) {
      return res.status(400).json({
        success: false,
        message: 'Installed by is required'
      });
    }

    // Find customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate project ID
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;

    // Create completion date object
    const projectCompletionDate = new Date(completionDate + 'T12:00:00.000Z');
    const projectCreationDate = new Date(completionDate + 'T12:00:00.000Z');

    // Create new old project object
    const newOldProject = {
      projectId,
      projectType,
      projectCategory: 'New Installation',
      initialRemark,
      installedBy,
      completionDate: projectCompletionDate,
      status: 'completed',
      createdAt: projectCreationDate
    };

    // Add to projects array
    customer.projects.push(newOldProject);

    // Save customer
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Old project added successfully',
      data: {
        customer,
        project: newOldProject
      }
    });
  } catch (err) {
    console.error('Error adding old project:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while adding old project'
    });
  }
};

module.exports = addOldProject;
