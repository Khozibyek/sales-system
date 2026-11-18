const Product = require("../models/ProductModel");

// Бүх бараа авах
exports.getAllProducts = (req, res) => {
  Product.getAll
    ? Product.getAll((err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      })
    : res.status(404).json({ error: "getAll function not found" });
};

// Нэг бараа авах
exports.getProductById = (req, res) => {
  const id = req.params.id;

  Product.getById(id, (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });
};


//  Ангиллын бараа авах
exports.getProductsByCategory = (req, res) => {
  const categoryId = req.params.id;
  Product.getByCategory(categoryId, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result || result.length === 0)
      return res.status(404).json({ message: "Энэ ангилалд бараа алга" });

    const categoryName = result[0].category_name;
    res.json({ category: categoryName, products: result });
  });
};

// Ангиллын жагсаалт авах
exports.getCategories = (req, res) => {
  Product.getCategories((err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
