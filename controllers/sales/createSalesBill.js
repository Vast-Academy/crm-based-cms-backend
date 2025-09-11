const SalesBill = require('../../models/salesBillModel');
const Dealer = require('../../models/dealerModel');
const Distributor = require('../../models/distributorModel');
const Item = require('../../models/inventoryModel');

// Function to update inventory stock after sale
async function updateInventoryStock(soldItems, userBranch) {
  for (const soldItem of soldItems) {
    const { itemId, serialNumber, quantity } = soldItem;
    
    const inventoryItem = await Item.findById(itemId);
    if (!inventoryItem) continue;
    
    if (inventoryItem.type === 'serialized-product') {
      // For serialized products, remove specific serial number from stock
      inventoryItem.stock = inventoryItem.stock.filter(stockItem => 
        !(stockItem.serialNumber === serialNumber && 
          stockItem.branch.toString() === userBranch.toString())
      );
    } else if (inventoryItem.type === 'generic-product') {
      // For generic products, reduce quantity from the branch stock
      let remainingQty = quantity;
      
      for (let i = 0; i < inventoryItem.stock.length && remainingQty > 0; i++) {
        const stockItem = inventoryItem.stock[i];
        
        if (stockItem.branch.toString() === userBranch.toString()) {
          const availableQty = stockItem.quantity;
          const toDeduct = Math.min(remainingQty, availableQty);
          
          stockItem.quantity -= toDeduct;
          remainingQty -= toDeduct;
          
          // Remove stock entry if quantity becomes 0
          if (stockItem.quantity <= 0) {
            inventoryItem.stock.splice(i, 1);
            i--; // Adjust index after removal
          }
        }
      }
    }
    
    // Save the updated inventory item
    await inventoryItem.save();
  }
}

async function createSalesBill(req, res) {
  try {
    const {
      customerType,
      customerId,
      items,
      paymentMethod,
      paidAmount,
      transactionId,
      notes
    } = req.body;

    // Validate required fields
    if (!customerType || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer type, customer ID, and items are required"
      });
    }

    if (!['dealer', 'distributor'].includes(customerType)) {
      return res.status(400).json({
        success: false,
        message: "Customer type must be either 'dealer' or 'distributor'"
      });
    }

    if (!['cash', 'online'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either 'cash' or 'online'"
      });
    }

    // Verify customer exists
    let customer;
    let customerModel;
    
    if (customerType === 'dealer') {
      customer = await Dealer.findById(customerId);
      customerModel = 'Dealer';
    } else {
      customer = await Distributor.findById(customerId);
      customerModel = 'Distributor';
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `${customerType.charAt(0).toUpperCase() + customerType.slice(1)} not found`
      });
    }

    // Process and validate items
    const processedItems = [];
    let subtotal = 0;

    for (const itemData of items) {
      const { itemId, quantity, serialNumber } = itemData;

      if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item ID and valid quantity are required for all items"
        });
      }

      // Get item details
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item not found: ${itemId}`
        });
      }

      // Get appropriate price based on customer type
      if (!item.pricing) {
        return res.status(400).json({
          success: false,
          message: `Multi-tier pricing not configured for item: ${item.name}`
        });
      }

      let unitPrice;
      if (customerType === 'dealer') {
        unitPrice = item.pricing.dealerPrice;
      } else {
        unitPrice = item.pricing.distributorPrice;
      }

      if (!unitPrice || unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${customerType} price for item: ${item.name}`
        });
      }

      // For serialized products, validate serial number availability
      if (item.type === 'serialized-product') {
        if (!serialNumber) {
          return res.status(400).json({
            success: false,
            message: `Serial number required for item: ${item.name}`
          });
        }

        // Check if serial number exists in current manager's branch stock
        const stockItem = item.stock.find(s => 
          s.serialNumber === serialNumber && 
          s.branch.toString() === req.user.branch.toString()
        );
        if (!stockItem) {
          return res.status(400).json({
            success: false,
            message: `Serial number ${serialNumber} not available in your branch for item: ${item.name}`
          });
        }
      } else if (item.type === 'generic-product') {
        // For generic products, check if enough quantity is available in manager's branch
        const branchStock = item.stock.filter(s => 
          s.branch.toString() === req.user.branch.toString()
        );
        const availableQty = branchStock.reduce((total, stock) => total + stock.quantity, 0);
        
        if (availableQty < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for item: ${item.name}. Available: ${availableQty}, Requested: ${quantity}`
          });
        }
      }

      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      processedItems.push({
        itemId,
        itemName: item.name,
        serialNumber: serialNumber || null,
        quantity,
        unitPrice,
        totalPrice
      });
    }

    // Calculate final amounts
    const total = subtotal;
    const paidAmountValue = paidAmount || 0;
    const dueAmount = Math.max(0, total - paidAmountValue);

    // Determine payment status
    let paymentStatus = 'pending';
    if (paidAmountValue >= total) {
      paymentStatus = 'completed';
    } else if (paidAmountValue > 0) {
      paymentStatus = 'partial';
    }

    // Generate bill number manually
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const billCount = await SalesBill.countDocuments({
      billNumber: { $regex: `^SB${year}${month}` }
    });
    
    const sequence = String(billCount + 1).padStart(4, '0');
    const billNumber = `SB${year}${month}${sequence}`;

    // Create sales bill data
    const billData = {
      billNumber,
      customerType,
      customerId,
      customerModel,
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      items: processedItems,
      subtotal,
      total,
      paymentMethod,
      paymentStatus,
      paidAmount: paidAmountValue,
      dueAmount,
      transactionId: transactionId || null,
      notes: notes || '',
      branch: req.user.branch || customer.branch,
      createdBy: req.userId
    };

    // Generate QR code data for online payments
    if (paymentMethod === 'online' && dueAmount > 0) {
      // Simple UPI string format - in real implementation, use proper UPI URL generator
      billData.qrCodeData = `upi://pay?pa=your-upi-id@bank&pn=Your Business Name&am=${dueAmount}&cu=INR&tn=Bill Payment`;
    }

    const salesBill = new SalesBill(billData);
    const savedBill = await salesBill.save();

    // Update inventory stock after successful bill creation
    await updateInventoryStock(processedItems, req.user.branch);

    res.status(201).json({
      success: true,
      message: "Sales bill created successfully",
      data: savedBill
    });

  } catch (error) {
    console.error('Error creating sales bill:', error);
    res.status(500).json({
      success: false,
      message: "Server error while creating sales bill"
    });
  }
}

module.exports = createSalesBill;