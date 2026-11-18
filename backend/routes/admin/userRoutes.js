const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserAddress,
  updateUserAddress,
} = require("../../controllers/admin/userController");
const verifyAdminToken = require("../../middlewares/adminAuth");

const router = express.Router();

router.get("/", verifyAdminToken, getAllUsers);
router.post("/", verifyAdminToken, createUser);
router.get("/:id", verifyAdminToken, getUserById);
router.put("/:id", verifyAdminToken, updateUser);
router.get("/:id/address", verifyAdminToken, getUserAddress);
router.put("/:id/address", verifyAdminToken, updateUserAddress);
router.patch("/:id/status", verifyAdminToken, updateUserStatus);
router.delete("/:id", verifyAdminToken, deleteUser);

module.exports = router;
