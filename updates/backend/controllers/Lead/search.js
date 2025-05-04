const Lead = require('../../models/leadModel');
const Customer = require('../../models/customerModel');

const search = async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }
      
      // Get branch filter
      const branchFilter = {};
      if (req.query.branch) {
        branchFilter.branch = req.query.branch;
      } else if (req.user.role !== 'admin') {
        branchFilter.branch = req.user.branch;
      }
      
      // Search in leads (non-converted)
      const leadResults = await Lead.find({
        ...branchFilter,
        isConverted: false,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phoneNumber: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select('name phoneNumber email status');
      
      // Search in customers
      const customerResults = await Customer.find({
        ...branchFilter,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phoneNumber: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select('name phoneNumber email convertedFromLead');
      
      // Format and combine results
      const formattedLeads = leadResults.map(lead => ({
        id: lead._id,
        name: lead.name,
        phoneNumber: lead.phoneNumber,
        email: lead.email || '',
        type: 'lead',
        status: lead.status
      }));
      
      const formattedCustomers = customerResults.map(customer => ({
        id: customer._id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        email: customer.email || '',
        type: 'customer',
        convertedFromLead: customer.convertedFromLead
      }));
      
      res.status(200).json({
        success: true,
        data: {
          leads: formattedLeads,
          customers: formattedCustomers
        }
      });
    } catch (err) {
      console.error('Error searching leads and customers:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while searching'
      });
    }
  };

 module.exports = search; 