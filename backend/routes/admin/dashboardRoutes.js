const express = require("express");
const { getOverviewStats, getRecentOrders } = require("../../controllers/admin/dashboardController");
const verifyAdminToken = require("../../middlewares/adminAuth");

const router = express.Router();

router.get("/overview", verifyAdminToken, getOverviewStats);
router.get("/recent-orders", verifyAdminToken, getRecentOrders);

module.exports = router;
