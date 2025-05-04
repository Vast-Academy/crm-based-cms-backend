const WarrantyReplacement = require('../../models/warrantyReplacementModel');

const getReplacementHistory = async (req, res) => {
  try {
    const { serialNumber } = req.params;
   
    if (!serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }
    
    // Find the initial warranty replacement for this serial number
    // Remove the populate('technician') since we no longer have that field
    const initialReplacement = await WarrantyReplacement.findOne({
      serialNumber: serialNumber
    }).lean();
   
    if (!initialReplacement) {
      return res.status(200).json({
        success: true,
        message: 'No replacements found for this serial number',
        data: []
      });
    }
    
    // Create an array to store all replacements in the chain
    const replacementChain = [initialReplacement];
   
    // Track the most recent replacement to follow the chain
    let currentReplacement = initialReplacement;
   
    // Follow the chain of replacements
    while (currentReplacement.replacementSerialNumber) {
      // Look for any warranty claim that used this replacement as the original
      // Remove the populate('technician') since we no longer have that field
      const nextReplacement = await WarrantyReplacement.findOne({
        serialNumber: currentReplacement.replacementSerialNumber
      }).lean();
     
      // If we found a next item in the chain, add it
      if (nextReplacement) {
        replacementChain.push(nextReplacement);
        currentReplacement = nextReplacement;
      } else {
        // No more replacements in the chain
        break;
      }
    }
   
    return res.status(200).json({
      success: true,
      data: replacementChain
    });
   
  } catch (error) {
    console.error('Error fetching replacement history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

module.exports = getReplacementHistory;