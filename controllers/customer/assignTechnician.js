const Customer = require('../../models/customerModel');
const User = require('../../models/userModel');
const sendNotification = require('../../helpers/push/sendNotification');

const assignTechnician = async (req, res) => {
    try {
      const { customerId, orderId, technicianId, instructions } = req.body;
      
      // Find the customer
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      // Find the work order
      const workOrder = customer.workOrders.find(order => order.orderId === orderId);
      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found'
        });
      }
      
      // Check permission based on branch
      if (req.user.role !== 'admin' && customer.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign technician for this work order'
        });
      }
      
      // Update work order
      workOrder.technician = technicianId;
      workOrder.assignedBy = req.user.id;
      workOrder.assignedAt = new Date();
      workOrder.status = 'assigned';
      workOrder.instructions = instructions;
      
      await customer.save();
      console.log("customer data", customer);

      try {
        const technician = await User.findById(technicianId).select('firstName fcmTokens');
        const tokens = technician?.fcmTokens?.map((entry) => entry.token).filter(Boolean) || [];

        if (tokens.length) {
          const customerName = (
            customer.name ||
            [customer.firstName, customer.lastName].filter(Boolean).join(' ')
          ).trim();

          const result = await sendNotification({
            tokens,
            notification: {
              title: 'New Work Assignment',
              body: `Order ${orderId} has been assigned to you.`,
            },
            data: {
              type: 'WORK_ASSIGNED',
              orderId: orderId.toString(),
              customerId: customerId.toString(),
              customerName,
              url: '/technician-dashboard',
            },
          });

          if (result.invalidTokens?.length) {
            technician.fcmTokens = technician.fcmTokens.filter(
              (entry) => !result.invalidTokens.includes(entry.token)
            );
            await technician.save();
          }
        }
      } catch (notificationError) {
        console.error('Failed to send technician notification:', notificationError);
      }
      
      res.status(200).json({
        success: true,
        message: 'Technician assigned successfully',
        data: workOrder
      });
    } catch (err) {
      console.error('Error assigning technician:', err);
      res.status(500).json({
        success: false,
        message: 'Server error while assigning technician'
      });
    }
  };


module.exports = assignTechnician;  
