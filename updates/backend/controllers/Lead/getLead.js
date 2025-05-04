const Lead = require('../../models/leadModel');

const getLead = async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .populate('createdBy', 'firstName lastName')
        .populate('branch', 'name')
        .populate('remarks.createdBy', 'firstName lastName');
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }
      
      // Check if user has access to this lead (admin or same branch)
      if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
         lead.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this lead'
        });
      }
      
      res.status(200).json({
        success: true,
        data: lead
      });
    } catch (err) {
      console.error('Error fetching lead:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching lead'
      });
    }
  };

module.exports = getLead;