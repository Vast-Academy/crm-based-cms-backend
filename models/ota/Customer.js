const mongoose = require("mongoose");

const otaCustomerSchema = new mongoose.Schema({
  name: String,
  email: String,
  githubInstallationId: {
    type: String,
    required: true,
    unique: true
  },
  githubUsername: String,
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
  updateStatus: {
    frontend: {
      available: { type: Boolean, default: false },
      pushed: { type: Boolean, default: false },
    },
    backend: {
      available: { type: Boolean, default: false },
      pushed: { type: Boolean, default: false },
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("OtaCustomer", otaCustomerSchema);
