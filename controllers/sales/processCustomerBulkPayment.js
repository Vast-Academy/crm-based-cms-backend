const SalesBill = require('../../models/salesBillModel');

async function processCustomerBulkPayment(req, res) {
  try {
    const {
      customerId,
      paymentAmount,
      receivedAmount,
      paymentMethod, // 'cash', 'upi', 'bank_transfer', 'cheque'
      transactionId,
      paymentDetails,
      notes
    } = req.body;

    // Validation
    if (!customerId || !paymentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, payment amount, and payment method are required"
      });
    }

    if (!['cash', 'upi', 'bank_transfer', 'cheque'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be cash, upi, bank_transfer, or cheque"
      });
    }

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0"
      });
    }

    // Get all pending bills for this customer (oldest first)
    const pendingBills = await SalesBill.find({
      customerId,
      customerType: 'customer',
      dueAmount: { $gt: 0 }
    }).sort({ createdAt: 1 }); // Oldest first (FIFO)

    if (pendingBills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending bills found for this customer"
      });
    }

    const totalDue = pendingBills.reduce((sum, bill) => sum + bill.dueAmount, 0);

    if (paymentAmount > totalDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount}) exceeds total due amount (₹${totalDue})`
      });
    }

    // Process payment (FIFO - oldest bills first)
    let remainingPayment = paymentAmount;
    const updatedBills = [];

    for (const bill of pendingBills) {
      if (remainingPayment <= 0) break;

      const paymentForThisBill = Math.min(remainingPayment, bill.dueAmount);
      
      // Update bill amounts
      bill.paidAmount += paymentForThisBill;
      bill.dueAmount -= paymentForThisBill;
      
      // Update payment status
      if (bill.dueAmount <= 0) {
        bill.paymentStatus = 'completed';
      } else if (bill.paidAmount > 0) {
        bill.paymentStatus = 'partial';
      }

      // Add payment transaction info and details if provided
      if (transactionId) {
        bill.transactionId = transactionId;
      }

      // Add enhanced payment details
      if (paymentDetails && Object.keys(paymentDetails).length > 0) {
        bill.paymentDetails = { ...bill.paymentDetails, ...paymentDetails };
      }

      // Set received amount for bank transfers
      if (paymentMethod === 'bank_transfer' && receivedAmount) {
        bill.receivedAmount = bill.receivedAmount + parseFloat(receivedAmount);
      } else if (paymentMethod !== 'bank_transfer') {
        bill.receivedAmount = bill.receivedAmount + paymentForThisBill;
      }

      await bill.save();
      
      updatedBills.push({
        billNumber: bill.billNumber,
        paymentApplied: paymentForThisBill,
        remainingDue: bill.dueAmount,
        status: bill.paymentStatus
      });

      remainingPayment -= paymentForThisBill;
    }

    // Calculate updated summary
    const allBillsAfterPayment = await SalesBill.find({
      customerId,
      customerType: 'customer'
    });

    const updatedSummary = {
      totalDueAfterPayment: allBillsAfterPayment.reduce((sum, bill) => sum + bill.dueAmount, 0),
      totalPaidAfterPayment: allBillsAfterPayment.reduce((sum, bill) => sum + bill.paidAmount, 0),
      pendingBillsCount: allBillsAfterPayment.filter(bill => bill.dueAmount > 0).length
    };

    res.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        paymentAmount,
        receivedAmount: receivedAmount || paymentAmount,
        paymentMethod,
        transactionId: transactionId || null,
        paymentDetails: paymentDetails || null,
        updatedBills,
        summary: updatedSummary,
        notes: notes || ''
      }
    });

  } catch (error) {
    console.error('Error processing customer bulk payment:', error);
    res.status(500).json({
      success: false,
      message: "Server error while processing payment"
    });
  }
}

module.exports = processCustomerBulkPayment;