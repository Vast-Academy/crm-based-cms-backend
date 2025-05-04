const Lead = require('../../models/leadModel');
const Customer = require('../../models/customerModel');

const updateLead = async (req, res) => {
    try {
      let lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }
      
      // Check if user has access to this lead (admin or same branch)
      if (req.user.role !== 'admin' && lead.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this lead'
        });
      }
      
      // Don't allow changing branch for non-admin users
      if (req.user.role !== 'admin' && req.body.branch) {
        delete req.body.branch;
      }
      
      // Update lead
      lead = await Lead.findByIdAndUpdate(
        req.params.id, 
        { 
          ...req.body, 
          updatedBy: req.user.id,
          updatedAt: Date.now()
        }, 
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        data: lead
      });
    } catch (err) {
      console.error('Error updating lead:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while updating lead'
      });
    }
  };

module.exports = updateLead;  