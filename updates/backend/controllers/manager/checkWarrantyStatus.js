const WarrantyReplacement = require('../../models/warrantyReplacementModel');

/**
 * Check if a serial number has an existing warranty claim
 * This helps direct the UI to show either the registration or replacement form
 */
const checkWarrantyStatus = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    // Find the warranty replacement for this serial number
    // We're most interested in pending claims
    const warrantyReplacement = await WarrantyReplacement.findOne({
      serialNumber: serialNumber,
      status: 'pending'
    }).lean();
    
    if (warrantyReplacement) {
      return res.status(200).json({
        success: true,
        message: 'Found pending warranty claim',
        data: warrantyReplacement
      });
    } else {
      // Also check for replaced status to inform the user
      const replacedWarranty = await WarrantyReplacement.findOne({
        serialNumber: serialNumber,
        status: 'replaced'
      }).lean();
      
      if (replacedWarranty) {
        return res.status(200).json({
          success: true,
          message: 'This product has already been replaced',
          data: replacedWarranty,
          isReplaced: true
        });
      }
      
      return res.status(200).json({
        success: false,
        message: 'No warranty claims found for this serial number'
      });
    }
    
  } catch (error) {
    console.error('Error checking warranty status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = checkWarrantyStatus;