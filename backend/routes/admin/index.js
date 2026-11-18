const express = require("express");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");

const router = express.Router();

router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/", authRoutes);

module.exports = router;
