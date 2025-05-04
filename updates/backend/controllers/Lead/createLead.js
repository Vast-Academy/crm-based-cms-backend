const Lead = require('../../models/leadModel');
const Customer = require('../../models/customerModel');

const createLead = async (req, res) => {
  try {
    // फ़ोन नंबर के लिए जांच करें
    const existingLead = await Lead.findOne({
      phoneNumber: req.body.phoneNumber,
      isConverted: false
    });
    
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'A lead with this phone number already exists'
      });
    }
    
    // ग्राहक में फ़ोन नंबर की जांच करें
    const existingCustomer = await Customer.findOne({
      phoneNumber: req.body.phoneNumber
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists',
        isCustomer: true,
        customerId: existingCustomer._id
      });
    }
    
    // यूजर रोल के आधार पर ब्रांच सेट करें
    let branch = req.body.branch;
    if (req.user.role !== 'admin') {
      branch = req.user.branch;
    }
    
    // लीड के लिए आवश्यक डेटा
    const leadData = {
      ...req.body,
      branch,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };
    
    // अगर initialRemark प्रदान किया गया है तो status सेट करें
    if (req.body.initialRemark) {
      leadData.status = req.body.initialRemark.status || 'neutral';
    }
    
    // नया लीड बनाएं
    const lead = await Lead.create(leadData);
    
    // अगर initialRemark प्रदान किया गया है तो रिमार्क जोड़ें
    if (req.body.initialRemark && req.body.initialRemark.text) {
      const remarkData = {
        text: req.body.initialRemark.text,
        status: req.body.initialRemark.status || 'neutral',
        createdBy: req.user.id
      };
      
      await Lead.findByIdAndUpdate(
        lead._id,
        { $push: { remarks: remarkData } },
        { new: true }
      );
      
      // अपडेटेड लीड प्राप्त करें
      const updatedLead = await Lead.findById(lead._id)
        .populate('createdBy', 'firstName lastName')
        .populate('branch', 'name')
        .populate('remarks.createdBy', 'firstName lastName');
      
      return res.status(201).json({
        success: true,
        data: updatedLead
      });
    }
    
    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lead'
    });
  }
};

module.exports = createLead;