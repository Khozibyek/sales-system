const Product = require("../../models/ProductModel");
const db = require("../../config/db");

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.map((img) => String(img).trim()).filter((img) => img.length);
  }
  if (typeof images === "string") {
    return images
      .split(/\r?\n/)
      .map((img) => img.trim())
      .filter((img) => img.length);
  }
  return [];
};

const parseSpecs = (specs) => {
  if (!Array.isArray(specs)) {
    return [];
  }

  return specs
    .map((item) => {
      if (!item || item.field_id === undefined) {
        return null;
      }
      const fieldId = Number(item.field_id);
      if (Number.isNaN(fieldId) || fieldId <= 0) {
        return null;
      }
      const rawValue = item.value !== undefined && item.value !== null ? String(item.value) : "";
      const value = rawValue.trim();
      if (!value.length) {
        return null;
      }

      return {
        field_id: fieldId,
        value,
      };
    })
    .filter(Boolean);
};

const normalizeProductPayload = (body) => {
  const errors = [];

  if (!body.name || !body.name.trim()) {
    errors.push("Нэр талбарыг бөглөнө үү.");
  }

  if (body.price === undefined || body.price === null || Number.isNaN(Number(body.price))) {
    errors.push("Үнэ буруу байна.");
  }

  if (!body.category_id) {
    errors.push("Ангиллыг сонгоно уу.");
  }

  if (errors.length) {
    const err = new Error(errors.join(" "));
    err.status = 400;
    throw err;
  }

  return {
    product_code: body.product_code ? String(body.product_code).trim() : null,
    name: body.name.trim(),
    description: body.description ? String(body.description) : null,
    price: Number(body.price),
    category_id: Number(body.category_id),
    brand_id: body.brand_id ? Number(body.brand_id) : null,
    model_id: body.model_id ? Number(body.model_id) : null,
    stock: body.stock !== undefined && body.stock !== null ? Number(body.stock) : 0,
    discount_percent:
      body.discount_percent !== undefined && body.discount_percent !== null
        ? Number(body.discount_percent)
        : 0,
    is_featured: body.is_featured ? 1 : 0,
  };
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.getAllAdmin();
    res.json({ products });
  } catch (err) {
    console.error("Admin get products error:", err.message);
    res.status(500).json({ error: "Бүтээгдэхүүний жагсаалтыг авахад алдаа гарлаа." });
  }
};

exports.getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.getAdminById(id);
    if (!product) {
      return res.status(404).json({ error: "Бүтээгдэхүүн олдсонгүй." });
    }

    res.json({ product });
  } catch (err) {
    console.error("Admin get product error:", err.message);
    res.status(500).json({ error: "Бүтээгдэхүүний мэдээлэл авахад алдаа гарлаа." });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    const images = parseImages(req.body.images);
    const specs = parseSpecs(req.body.specs);

    const id = await Product.createAdmin(payload, images, specs);

    res.status(201).json({ message: "Бүтээгдэхүүн амжилттай нэмэгдлээ.", id });
  } catch (err) {
    console.error("Admin create product error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Бүтээгдэхүүн нэмэхэд алдаа гарлаа." });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const payload = normalizeProductPayload(req.body);
    const images = parseImages(req.body.images);
    const specs = parseSpecs(req.body.specs);

    await Product.updateAdmin(id, payload, images, specs);

    res.json({ message: "Бүтээгдэхүүний мэдээлэл шинэчлэгдлээ." });
  } catch (err) {
    console.error("Admin update product error:", err.message);
    res.status(err.status || 500).json({ error: err.message || "Бүтээгдэхүүн шинэчлэхэд алдаа гарлаа." });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await Product.deleteAdmin(id);
    res.json({ message: "Бүтээгдэхүүнийг амжилттай устгалаа." });
  } catch (err) {
    console.error("Admin delete product error:", err.message);
    res.status(500).json({ error: "Бүтээгдэхүүн устгахад алдаа гарлаа." });
  }
};

exports.getProductOptions = async (req, res) => {
  try {
    const conn = db.promise();
    const [categories] = await conn.query("SELECT id, name FROM categories ORDER BY name ASC");
    const [brands] = await conn.query(
      "SELECT id, name, category_id FROM brands ORDER BY name ASC"
    );
    const [models] = await conn.query(
      "SELECT id, name, brand_id, category_id FROM models ORDER BY name ASC"
    );
    const [specFields] = await conn.query("SELECT id, name FROM spec_fields ORDER BY name ASC");

    res.json({ categories, brands, models, specFields });
  } catch (err) {
    console.error("Admin get product options error:", err.message);
    res.status(500).json({ error: "Сонголтын мэдээлэл авахад алдаа гарлаа." });
  }
};

exports.createCategoryOption = async (req, res) => {
  const name = req.body.name ? String(req.body.name).trim() : "";
  if (!name.length) {
    return res.status(400).json({ error: "Ангиллын нэрийг оруулна уу." });
  }

  try {
    const conn = db.promise();
    const [result] = await conn.query("INSERT INTO categories (name) VALUES (?)", [name]);
    res.status(201).json({ category: { id: result.insertId, name } });
  } catch (err) {
    console.error("Admin create category option error:", err.message);
    res.status(500).json({ error: "Ангилал нэмэхэд алдаа гарлаа." });
  }
};

exports.createBrandOption = async (req, res) => {
  const name = req.body.name ? String(req.body.name).trim() : "";
  const categoryId = Number(req.body.category_id);

  if (!name.length) {
    return res.status(400).json({ error: "Брэндийн нэрийг оруулна уу." });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "Ангиллыг сонгоно уу." });
  }

  try {
    const conn = db.promise();
    const [categoryRows] = await conn.query("SELECT id FROM categories WHERE id = ?", [categoryId]);
    if (!categoryRows.length) {
      return res.status(404).json({ error: "Сонгосон ангилал олдсонгүй." });
    }

    const [result] = await conn.query("INSERT INTO brands (name, category_id) VALUES (?, ?)", [
      name,
      categoryId,
    ]);

    res.status(201).json({ brand: { id: result.insertId, name, category_id: categoryId } });
  } catch (err) {
    console.error("Admin create brand option error:", err.message);
    res.status(500).json({ error: "Брэнд нэмэхэд алдаа гарлаа." });
  }
};

exports.createModelOption = async (req, res) => {
  const name = req.body.name ? String(req.body.name).trim() : "";
  const brandId = Number(req.body.brand_id);
  let categoryId = req.body.category_id ? Number(req.body.category_id) : null;

  if (!name.length) {
    return res.status(400).json({ error: "Моделийн нэрийг оруулна уу." });
  }
  if (!brandId) {
    return res.status(400).json({ error: "Брэндийг сонгоно уу." });
  }

  try {
    const conn = db.promise();
    const [brandRows] = await conn.query("SELECT id, category_id FROM brands WHERE id = ?", [
      brandId,
    ]);
    if (!brandRows.length) {
      return res.status(404).json({ error: "Сонгосон брэнд олдсонгүй." });
    }

    if (!categoryId) {
      categoryId = brandRows[0].category_id ? Number(brandRows[0].category_id) : null;
    }

    const [result] = await conn.query(
      "INSERT INTO models (name, brand_id, category_id) VALUES (?, ?, ?)",
      [name, brandId, categoryId]
    );

    res
      .status(201)
      .json({ model: { id: result.insertId, name, brand_id: brandId, category_id: categoryId } });
  } catch (err) {
    console.error("Admin create model option error:", err.message);
    res.status(500).json({ error: "Модел нэмэхэд алдаа гарлаа." });
  }
};

exports.createSpecFieldOption = async (req, res) => {
  const name = req.body.name ? String(req.body.name).trim() : "";
  if (!name.length) {
    return res.status(400).json({ error: "Үзүүлэлтийн нэрийг оруулна уу." });
  }

  try {
    const conn = db.promise();
    const [result] = await conn.query("INSERT INTO spec_fields (name) VALUES (?)", [name]);
    res.status(201).json({ specField: { id: result.insertId, name } });
  } catch (err) {
    console.error("Admin create spec field option error:", err.message);
    res.status(500).json({ error: "Үзүүлэлт нэмэхэд алдаа гарлаа." });
  }
};
