const Customer = require('../../models/customerModel');

const getCustomer = async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)
        .populate('createdBy', 'firstName lastName')
        .populate('branch', 'name')
        .populate('leadId');
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      // Check if user has access to this customer
      if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
        customer.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this customer'
        });
      }
      
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (err) {
      console.error('Error fetching customer:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching customer'
      });
    }
};

module.exports = getCustomer;