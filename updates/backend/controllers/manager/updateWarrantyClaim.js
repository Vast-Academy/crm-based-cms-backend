const WarrantyReplacement = require('../../models/warrantyReplacementModel');

const updateWarrantyClaim = async (req, res) => {
    try {
      const { replacementId, issueDescription, issueCheckedBy } = req.body;
      
      if (!replacementId || !issueDescription || !issueCheckedBy) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Find the warranty replacement record
      const replacement = await WarrantyReplacement.findById(replacementId);
      
      if (!replacement) {
        return res.status(404).json({
          success: false,
          message: 'Warranty replacement record not found'
        });
      }

       // Add new issue to the issues array
    replacement.issues.push({
      issueDescription,
      issueCheckedBy,
      reportedAt: new Date()
    });
      
      // Update the record to reset cycle
      replacement.status = 'pending';
      
      await replacement.save();
      
      return res.status(200).json({
        success: true,
        message: 'New warranty issue added successfully',
        data: replacement
      });
    } catch (error) {
      console.error('Error updating warranty claim:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.'
      });
    }
  };

  module.exports = updateWarrantyClaim;