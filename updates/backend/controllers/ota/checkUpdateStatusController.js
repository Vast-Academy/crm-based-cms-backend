const Customer = require("../../models/ota/Customer");

const checkUpdateStatus = async (req, res) => {
  const { customerId } = req.query;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const updateType = customer.updateStatus.frontend.available
      ? "frontend"
      : customer.updateStatus.backend.available
      ? "backend"
      : null;

    res.json({
      updateAvailable: !!updateType,
      updateType,
    });
  } catch (err) {
    console.error("Check update status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = checkUpdateStatus;
