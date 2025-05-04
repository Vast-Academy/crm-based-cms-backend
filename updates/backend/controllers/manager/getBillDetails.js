const BillModel = require('../../models/billModel');

// billController.js में
const getBillDetails = async (req, res) => {
    try {
      const billId = req.params.id;
      
      const bill = await BillModel.findById(billId);
      
      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Bill details fetched successfully',
        data: bill
      });
    } catch (err) {
      console.error('Error fetching bill details:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching bill details'
      });
    }
  };
  
module.exports = getBillDetails;