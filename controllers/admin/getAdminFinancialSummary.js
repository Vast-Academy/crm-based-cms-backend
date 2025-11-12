const mongoose = require('mongoose');
const SalesBill = require('../../models/salesBillModel');
const Bill = require('../../models/billModel');

const getAdminFinancialSummary = async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view overall financial summary.',
      });
    }

    // Aggregate financial data from ALL branches (no branch filter)
    const summaryPipeline = [
      {
        $facet: {
          // Total revenue from ALL bill types (customer, dealer, distributor) across ALL branches
          totals: [
            {
              $group: {
                _id: null,
                totalBilledAmount: { $sum: { $ifNull: ['$total', 0] } },
                amountCollected: { $sum: { $ifNull: ['$paidAmount', 0] } },
                outstandingAmount: { $sum: { $ifNull: ['$dueAmount', 0] } },
                totalBills: { $sum: 1 },
              },
            },
          ],
          // Calculate total expenses from inventory items (purchase price * quantity)
          expenses: [
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'items',
                localField: 'items.itemId',
                foreignField: '_id',
                as: 'itemDetails',
              },
            },
            { $unwind: '$itemDetails' },
            {
              $match: {
                'itemDetails.type': {
                  $in: ['serialized-product', 'generic-product'],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalExpenses: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ['$items.quantity', 0] },
                      { $ifNull: ['$itemDetails.purchasePrice', 0] },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          totals: { $ifNull: [{ $arrayElemAt: ['$totals', 0] }, {}] },
          expenses: { $ifNull: [{ $arrayElemAt: ['$expenses', 0] }, {}] },
        },
      },
      {
        $project: {
          totalBilledAmount: {
            $round: [{ $ifNull: ['$totals.totalBilledAmount', 0] }, 2],
          },
          amountCollected: {
            $round: [{ $ifNull: ['$totals.amountCollected', 0] }, 2],
          },
          outstandingAmount: {
            $round: [{ $ifNull: ['$totals.outstandingAmount', 0] }, 2],
          },
          totalBills: { $ifNull: ['$totals.totalBills', 0] },
          totalExpenses: {
            $round: [{ $ifNull: ['$expenses.totalExpenses', 0] }, 2],
          },
        },
      },
    ];

    const [summaryDoc] = await SalesBill.aggregate(summaryPipeline);

    const summary = summaryDoc || {
      totalBilledAmount: 0,
      amountCollected: 0,
      outstandingAmount: 0,
      totalBills: 0,
      totalExpenses: 0,
    };

    // Fetch Work Order Bills (technician bills) from ALL branches
    let workOrderBillsData = {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      count: 0,
    };

    try {
      // Get all approved work order bills from all branches
      const workOrderBills = await Bill.aggregate([
        { $match: { status: 'approved' } }, // Only approved bills
        {
          $group: {
            _id: null,
            totalBilled: { $sum: { $ifNull: ['$totalAmount', 0] } },
            totalCollected: { $sum: { $ifNull: ['$amountPaid', 0] } },
            totalOutstanding: { $sum: { $ifNull: ['$amountDue', 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      if (workOrderBills.length > 0) {
        workOrderBillsData = workOrderBills[0];
      }
    } catch (workOrderError) {
      console.error('Error fetching work order bills:', workOrderError);
      // Continue without work order bills data
    }

    // Combine sales bills and work order bills data
    const totalBilledAmount = Number(summary.totalBilledAmount || 0) + Number(workOrderBillsData.totalBilled || 0);
    const amountCollected = Number(summary.amountCollected || 0) + Number(workOrderBillsData.totalCollected || 0);
    const outstandingAmount = Number(summary.outstandingAmount || 0) + Number(workOrderBillsData.totalOutstanding || 0);
    const totalExpenses = Number(summary.totalExpenses || 0);
    const totalBills = (summary.totalBills || 0) + (workOrderBillsData.count || 0);

    // Calculate Net Profit (Collection - Expenses, excluding services)
    const netProfit = amountCollected - totalExpenses;
    const collectionRate = totalBilledAmount > 0
      ? Number(((amountCollected / totalBilledAmount) * 100).toFixed(1))
      : 0;
    const profitMargin = amountCollected > 0
      ? Number(((netProfit / amountCollected) * 100).toFixed(1))
      : 0;

    // Calculate average collection time across all branches
    let averageCollectionTime = 0;
    try {
      // Get average collection time from completed sales bills
      const salesBillsCollectionTime = await SalesBill.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $project: {
            diffDays: {
              $let: {
                vars: {
                  days: {
                    $divide: [
                      {
                        $subtract: [
                          { $ifNull: ['$updatedAt', '$createdAt'] },
                          '$createdAt',
                        ],
                      },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                },
                in: {
                  $cond: [{ $lt: ['$$days', 0] }, 0, '$$days'],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            averageCollectionTime: { $avg: '$diffDays' },
          },
        },
      ]);

      if (salesBillsCollectionTime.length > 0) {
        averageCollectionTime = Math.round(salesBillsCollectionTime[0].averageCollectionTime || 0);
      }
    } catch (err) {
      console.error('Error calculating average collection time:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        totalBilledAmount,
        amountCollected,
        outstandingAmount,
        totalBills,
        totalExpenses,
        netProfit,
        collectionRate,
        profitMargin,
        averageCollectionTime,
      },
    });
  } catch (error) {
    console.error('Error fetching admin financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin financial summary',
    });
  }
};

module.exports = getAdminFinancialSummary;
