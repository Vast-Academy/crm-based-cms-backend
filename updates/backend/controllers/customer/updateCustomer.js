const Customer = require('../../models/customerModel');

const updateCustomer = async (req, res) => {
    try {
      let customer = await Customer.findById(req.params.id);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      // Check if user has access to this customer
      if (req.user.role !== 'admin' && customer.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this customer'
        });
      }
      
      // Don't allow changing branch for non-admin users
      if (req.user.role !== 'admin' && req.body.branch) {
        delete req.body.branch;
      }
      
      // Update customer
      customer = await Customer.findByIdAndUpdate(
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
        data: customer
      });
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while updating customer'
      });
    }
  };

 module.exports = updateCustomer; 