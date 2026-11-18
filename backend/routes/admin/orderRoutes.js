const express = require("express");
const verifyAdminToken = require("../../middlewares/adminAuth");
const {
  listOrders,
  getOrderDetail,
  updateOrderStatus,
} = require("../../controllers/admin/ordersController");

const router = express.Router();

router.get("/", verifyAdminToken, listOrders);
router.get("/:id", verifyAdminToken, getOrderDetail);
router.patch("/:id/status", verifyAdminToken, updateOrderStatus);

module.exports = router;
