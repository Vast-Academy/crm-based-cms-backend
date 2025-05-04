const Customer = require("../../models/ota/Customer");

const markUpdateAvailable = async (req, res) => {
  const { customerId, updateType } = req.body;

  if (!["frontend", "backend"].includes(updateType)) {
    return res.status(400).json({ error: "Invalid update type" });
  }

  try {
    await Customer.findByIdAndUpdate(customerId, {
      [`updateStatus.${updateType}.available`]: true,
      [`updateStatus.${updateType}.pushed`]: false,
    });

    res.json({ message: "Update marked as available." });
  } catch (err) {
    console.error("Error marking update:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = markUpdateAvailable;