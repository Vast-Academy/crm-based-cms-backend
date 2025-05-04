const Lead = require('../../models/leadModel');

const addRemark = async (req, res) => {
    try {
      const { text, status } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Remark text is required'
        });
      }
      
      let lead = await Lead.findById(req.params.id);
      
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
          message: 'Not authorized to update this lead'
        });
      }
      
      // Add remark and update lead status
      const newRemark = {
        text,
        status: status || 'neutral',
        createdBy: req.user.id
      };
      
      lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { 
          $push: { remarks: newRemark },
          status: status || lead.status,
          updatedBy: req.user.id,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      ).populate('remarks.createdBy', 'firstName lastName');
      
      res.status(200).json({
        success: true,
        data: lead
      });
    } catch (err) {
      console.error('Error adding remark:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while adding remark'
      });
    }
  };

module.exports = addRemark;  