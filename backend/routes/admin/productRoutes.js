const express = require("express");
const verifyAdminToken = require("../../middlewares/adminAuth");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductOptions,
  createCategoryOption,
  createBrandOption,
  createModelOption,
  createSpecFieldOption,
} = require("../../controllers/admin/productController");

const router = express.Router();

router.get("/options", verifyAdminToken, getProductOptions);
router.post("/categories", verifyAdminToken, createCategoryOption);
router.post("/brands", verifyAdminToken, createBrandOption);
router.post("/models", verifyAdminToken, createModelOption);
router.post("/spec-fields", verifyAdminToken, createSpecFieldOption);
router.get("/", verifyAdminToken, getProducts);
router.post("/", verifyAdminToken, createProduct);
router.get("/:id", verifyAdminToken, getProduct);
router.put("/:id", verifyAdminToken, updateProduct);
router.delete("/:id", verifyAdminToken, deleteProduct);

module.exports = router;
