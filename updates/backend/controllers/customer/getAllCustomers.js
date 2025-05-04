const Customer = require('../../models/customerModel');

const getAllCustomers = async (req, res) => {
    try {
      // Get branch filter
      const branchFilter = {};
      if (req.query.branch) {
        branchFilter.branch = req.query.branch;
      } else if (req.userRole !== 'admin') {
        branchFilter.branch = req.userBranch;
      }
      
      const customers = await Customer.find(branchFilter)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'firstName lastName')
        .populate('branch', 'name');
      
      res.status(200).json({
        success: true,
        count: customers.length,
        data: customers
      });
    } catch (err) {
      console.error('Error fetching customers:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching customers'
      });
    }
  };

module.exports = getAllCustomers;  