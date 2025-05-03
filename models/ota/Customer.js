const mongoose = require("mongoose");

const otaCustomerSchema = new mongoose.Schema({
  name: String,
  email: String,
  githubInstallationId: {
    type: String,
    required: true,
    unique: true
  },
  repoOwner: String,
  frontendRepo: String,
  backendRepo: String,
  repositories: [
    {
      name: String,
      full_name: String,
      private: Boolean,
      html_url: String,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("OtaCustomer", otaCustomerSchema);
