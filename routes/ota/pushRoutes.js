const express = require("express");
const router = express.Router();
// const { pushUpdateToRepo } = require("../../controllers/ota/pushUpdateController");
const markUpdateAvailable = require("../../controllers/ota/markUpdateAvailableController");
const checkUpdateStatus = require("../../controllers/ota/checkUpdateStatusController");

// router.post("/push-update", pushUpdateToRepo);
router.post("/mark-update-available", markUpdateAvailable);
router.get("/check-update-status", checkUpdateStatus);

module.exports = router;