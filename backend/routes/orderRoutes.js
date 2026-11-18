const express = require("express");
const router = express.Router();
const orderController = require("../controllers/user/orderController");

// ✅ Захиалга үүсгэх
// POST /api/orders/create
router.post("/create", orderController.createOrder);
router.get("/user/:userId/with-items", orderController.getUserOrdersWithItems);


module.exports = router;
