const Customer = require("../../models/ota/Customer");

const checkUpdateStatus = async (req, res) => {
  const { customerId } = req.query;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // चेक करें कि कौन सा अपडेट उपलब्ध है
    let updateAvailable = false;
    let updateType = null;

    if (customer.updateStatus.frontend.available && !customer.updateStatus.frontend.pushed) {
      updateAvailable = true;
      updateType = "frontend";
    } else if (customer.updateStatus.backend.available && !customer.updateStatus.backend.pushed) {
      updateAvailable = true;
      updateType = "backend";
    }

    res.json({
      updateAvailable,
      updateType,
    });
  } catch (err) {
    console.error("Check update status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = checkUpdateStatus;