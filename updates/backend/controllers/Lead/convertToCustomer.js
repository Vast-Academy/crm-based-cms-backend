const Lead = require('../../models/leadModel');
const Customer = require('../../models/customerModel');

const convertToCustomer = async (req, res) => {
  try {
    const { projectType, initialRemark } = req.body;
    
    // Validate project type
    if (!projectType) {
      return res.status(400).json({
        success: false,
        message: 'Project type is required when converting to customer'
      });
    }
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Check if user has access to this lead
    if (req.user.role !== 'admin' && lead.branch.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to convert this lead'
      });
    }
    
    // Check if already converted
    if (lead.isConverted) {
      return res.status(400).json({
        success: false,
        message: 'Lead already converted to customer'
      });
    }
    
    // Create new customer from lead data
    const customer = await Customer.create({
      name: lead.name,
      phoneNumber: lead.phoneNumber,
      email: lead.email,
      whatsappNumber: lead.whatsappNumber,
      address: lead.address,
      age: lead.age,
      branch: lead.branch,
      convertedFromLead: true,
      leadId: lead._id,
      // Include project information
      projectType,
      initialRemark,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    // Update lead as converted
    await Lead.findByIdAndUpdate(req.params.id, {
      isConverted: true,
      convertedToCustomer: customer._id,
      convertedAt: Date.now(),
      updatedBy: req.user.id,
      updatedAt: Date.now()
    });
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    console.error('Error converting lead to customer:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while converting lead to customer'
    });
  }
};

module.exports = convertToCustomer;