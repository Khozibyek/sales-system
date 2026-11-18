const express = require("express");
const { loginAdmin, getAdminProfile, changePassword } = require("../../controllers/admin/authController");
const verifyAdminToken = require("../../middlewares/adminAuth");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/profile", verifyAdminToken, getAdminProfile);
router.post("/change-password", verifyAdminToken, changePassword);

module.exports = router;
