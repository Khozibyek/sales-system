const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductsByCategory,
  getProductById,
  getCategories,
} = require("../controllers/ProductController");

router.get("/categories", getCategories);
router.get("/category/:id", getProductsByCategory);
router.get("/", getAllProducts);
router.get("/:id", getProductById);

module.exports = router;
