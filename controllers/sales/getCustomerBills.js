const SalesBill = require('../../models/salesBillModel');

async function getCustomerBills(req, res) {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    // Fetch all bills for this customer
    const bills = await SalesBill.find({
      customerId,
      customerType: 'customer'
    })
    .sort({ createdAt: -1 }) // Latest first
    .populate('createdBy', 'firstName lastName email')
    .populate('branch', 'name location');

    // Calculate totals
    const totalBills = bills.length;
    const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
    const totalDue = bills.reduce((sum, bill) => sum + bill.dueAmount, 0);
    const pendingBills = bills.filter(bill => bill.dueAmount > 0);

    res.json({
      success: true,
      data: {
        bills,
        summary: {
          totalBills,
          totalAmount,
          totalPaid,
          totalDue,
          pendingBillsCount: pendingBills.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer bills:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching customer bills"
    });
  }
}

module.exports = getCustomerBills;