const WarrantyReplacement = require('../../models/warrantyReplacementModel');

/**
 * Find warranty replacement by replacement serial number
 * This helps when a user searches for a replacement serial number
 */
const findByReplacementSerial = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    // Find the warranty replacement where this serial was used as a replacement
    const warrantyReplacements = await WarrantyReplacement.find({ 
      "issues.replacementSerialNumber": serialNumber 
    }).lean();
    
    if (warrantyReplacements.length > 0) {
      // Sort by createdAt to get the most recent if there are multiple matches
      warrantyReplacements.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return res.status(200).json({
        success: true,
        message: 'Found as a replacement serial number',
        data: warrantyReplacements[0]
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Not found as a replacement serial number'
      });
    }
    
  } catch (error) {
    console.error('Error finding by replacement serial:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = findByReplacementSerial;