const Customer = require('../../models/customerModel');
const TechnicianInventory = require('../../models/technicianInventoryModel');
const WarrantyReplacement = require('../../models/warrantyReplacementModel');

const getAllWarrantyReplacements = async (req, res) => {
    try {
      // Get optional branch filter from query
      const branchFilter = req.query.branch ? { branch: req.query.branch } : {};
      
      const replacements = await WarrantyReplacement.find(branchFilter)
        .sort({ createdAt: -1 })
        .populate('registeredBy', 'firstName lastName')
        .lean();
      
      return res.status(200).json({
        success: true,
        data: replacements
      });
      
    } catch (error) {
      console.error('Error fetching warranty replacements:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

module.exports = getAllWarrantyReplacements;  
