const Lead = require('../../models/leadModel');

const getAllLeads = async (req, res) => {
    try {
      // प्रथम जांचें कि req.user मौजूद है
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

      // Get branch filter if user is admin and branch is specified
      const branchFilter = {};
      if (req.query.branch) {
        branchFilter.branch = req.query.branch;
      } else if (req.userRole !== 'admin') {
        // Non-admin users can only see leads from their branch
        branchFilter.branch = req.userBranch; 
      }
      
      // Filter only non-converted leads
      const leads = await Lead.find({ 
        ...branchFilter,
        isConverted: false
      })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .populate('branch', 'name');
      
      res.status(200).json({
        success: true,
        count: leads.length,
        data: leads
      });
    } catch (err) {
      console.error('Error fetching leads:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching leads'
      });
    }
  };

module.exports = getAllLeads;  