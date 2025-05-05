const express = require("express");
const router = express.Router();
const { pushUpdateToRepo } = require("../../controllers/ota/pushUpdateController");
const markUpdateAvailable = require("../../controllers/ota/markUpdateAvailableController");
const checkUpdateStatus = require("../../controllers/ota/checkUpdateStatusController");
const { getCustomers } = require("../../controllers/ota/customerController");

router.post("/push-update", pushUpdateToRepo);
router.post("/mark-update-available", markUpdateAvailable);
router.get("/check-update-status", checkUpdateStatus);
router.get("/customers", getCustomers )

module.exports = router;