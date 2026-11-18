const db = require("../config/db");

const Product = {
  // 🔹 Бүх бараа + tag-уудтай нь авах
  getAll: (callback) => {
  const sql = `
    SELECT 
      p.id, 
      p.name, 
      p.price, 
      p.discount_percent,
      p.stock,
      (p.stock = 0) AS out_of_stock,
      (p.price * (1 - p.discount_percent / 100)) AS discounted_price,
      p.is_featured,
      (
        SELECT pi.image_url 
        FROM product_images pi 
        WHERE pi.product_id = p.id AND pi.is_main = 1 
        LIMIT 1
      ) AS main_image,

      b.name AS brand,
      c.name AS category,
      m.name AS model,

      TIMESTAMPDIFF(DAY, p.created_at, NOW()) AS days_since_added
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN models m ON p.model_id = m.id
    ORDER BY p.created_at DESC;
  `;
  db.query(sql, callback);
},


  // 🔹 Нэг бараа авах
getById: (id, callback) => {
  const sql = `
    SELECT 
      p.id,
      p.product_code,
      p.name,
      p.description,
      p.price,
      p.discount_percent,
      p.stock,
      p.is_featured,
      p.created_at,
      b.name AS brand,
      c.name AS category,
      m.name AS model,
      GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.id SEPARATOR ',') AS images
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN models m ON p.model_id = m.id
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.id = ?
    GROUP BY 
      p.id, p.product_code, p.name, p.description, p.price, p.discount_percent, 
      p.stock, p.is_featured, p.created_at, b.name, c.name, m.name;
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) return callback(err, null);
    if (rows.length === 0) return callback(null, null);

    const product = rows[0];

    // 🖼 Зураг массив болгоно
    product.images = product.images
      ? product.images.split(",").map((img) => img.trim())
      : [];

    // 🧩 Үзүүлэлтүүд
    const specSql = `
      SELECT sf.name AS field_name, ps.value
      FROM product_specs ps
      JOIN spec_fields sf ON ps.field_id = sf.id
      WHERE ps.product_id = ?;
    `;

    db.query(specSql, [id], (specErr, specRows) => {
      if (specErr) return callback(specErr, null);
      product.specs = specRows || [];
      callback(null, product);
    });
  });
},



 getByCategory: (categoryId, callback) => {
  const sql = `
    SELECT 
      p.id, 
      p.name, 
      p.price, 
      p.stock,
      (p.stock = 0) AS is_out_of_stock,
      p.discount_percent,
      (p.price * (1 - p.discount_percent / 100)) AS discounted_price,
      p.is_featured,
      (
        SELECT pi.image_url 
        FROM product_images pi 
        WHERE pi.product_id = p.id AND pi.is_main = 1 
        LIMIT 1
      ) AS main_image,

      b.name AS brand,
      c.name AS category_name,
      m.name AS model,

      TIMESTAMPDIFF(DAY, p.created_at, NOW()) AS days_since_added

    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN models m ON p.model_id = m.id
    WHERE p.category_id = ?
    ORDER BY p.created_at DESC;
  `;
  db.query(sql, [categoryId], callback);
},


  getCategories: (callback) => {
    const sql = "SELECT id, name FROM categories ORDER BY id ASC;";
    db.query(sql, callback);
  },
  getAllAdmin: async () => {
    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT 
         p.id,
         p.product_code,
         p.name,
         p.price,
         p.stock,
         p.discount_percent,
         p.is_featured,
         p.created_at,
         c.name AS category_name,
         b.name AS brand_name,
         m.name AS model_name,
         COALESCE(
           (
             SELECT pi_main.image_url
             FROM product_images pi_main
             WHERE pi_main.product_id = p.id AND pi_main.is_main = 1
             ORDER BY pi_main.id ASC
             LIMIT 1
           ),
           (
             SELECT pi_any.image_url
             FROM product_images pi_any
             WHERE pi_any.product_id = p.id
             ORDER BY pi_any.id ASC
             LIMIT 1
           )
         ) AS main_image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN models m ON p.model_id = m.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  },
  getAdminById: async (id) => {
    const conn = db.promise();
    const [rows] = await conn.query(
      `SELECT 
         p.id,
         p.product_code,
         p.name,
         p.description,
         p.price,
         p.discount_percent,
         p.stock,
         p.is_featured,
         p.category_id,
         p.brand_id,
         p.model_id,
         p.created_at,
         c.name AS category_name,
         b.name AS brand_name,
         m.name AS model_name,
         COALESCE(
           (
             SELECT pi_main.image_url
             FROM product_images pi_main
             WHERE pi_main.product_id = p.id AND pi_main.is_main = 1
             ORDER BY pi_main.id ASC
             LIMIT 1
           ),
           (
             SELECT pi_any.image_url
             FROM product_images pi_any
             WHERE pi_any.product_id = p.id
             ORDER BY pi_any.id ASC
             LIMIT 1
           )
         ) AS main_image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE p.id = ?`
    , [id]);

    if (!rows.length) {
      return null;
    }

    const product = rows[0];

    const [imageRows] = await conn.query(
      `SELECT id, image_url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC, id ASC`
    , [id]);

    product.images = imageRows.map((row) => ({
      id: row.id,
      url: row.image_url,
      is_main: !!row.is_main,
    }));

    const [specRows] = await conn.query(
      `SELECT ps.id AS spec_id, ps.field_id, sf.name AS field_name, ps.value
       FROM product_specs ps
       JOIN spec_fields sf ON ps.field_id = sf.id
       WHERE ps.product_id = ?
       ORDER BY sf.name ASC`
    , [id]);

    product.specs = Array.isArray(specRows)
      ? specRows.map((row) => ({
          spec_id: row.spec_id,
          field_id: row.field_id,
          field_name: row.field_name,
          value: row.value != null ? String(row.value) : "",
        }))
      : [];

    return product;
  },
  createAdmin: async (product, images = [], specs = []) => {
    const conn = db.promise();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO products
         (product_code, name, description, price, category_id, brand_id, model_id, stock, discount_percent, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        product.product_code || null,
        product.name,
        product.description || null,
        product.price,
        product.category_id,
        product.brand_id || null,
        product.model_id || null,
        product.stock ?? 0,
        product.discount_percent ?? 0,
        product.is_featured ? 1 : 0,
      ]);

      const productId = result.insertId;

      const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [];

      for (let i = 0; i < normalizedImages.length; i += 1) {
        await conn.query(
          `INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)`,
          [productId, normalizedImages[i], i === 0 ? 1 : 0]
        );
      }

      const normalizedSpecs = Array.isArray(specs)
        ? specs
            .filter((item) => {
              if (!item) return false;
              const fieldId = Number(item.field_id);
              if (!Number.isFinite(fieldId) || fieldId <= 0) {
                return false;
              }
              return item.value !== undefined && item.value !== null;
            })
            .map((item) => ({
              field_id: Number(item.field_id),
              value: String(item.value).slice(0, 255),
            }))
        : [];

      for (let i = 0; i < normalizedSpecs.length; i += 1) {
        await conn.query(
          `INSERT INTO product_specs (product_id, field_id, value) VALUES (?, ?, ?)`,
          [productId, normalizedSpecs[i].field_id, normalizedSpecs[i].value]
        );
      }

      await conn.commit();
      return productId;
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  },
  updateAdmin: async (id, product, images = [], specs = []) => {
    const conn = db.promise();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE products SET
           product_code = ?,
           name = ?,
           description = ?,
           price = ?,
           category_id = ?,
           brand_id = ?,
           model_id = ?,
           stock = ?,
           discount_percent = ?,
           is_featured = ?
         WHERE id = ?`,
        [
          product.product_code || null,
          product.name,
          product.description || null,
          product.price,
          product.category_id,
          product.brand_id || null,
          product.model_id || null,
          product.stock ?? 0,
          product.discount_percent ?? 0,
          product.is_featured ? 1 : 0,
          id,
        ]
      );

      await conn.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);

      const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [];

      for (let i = 0; i < normalizedImages.length; i += 1) {
        await conn.query(
          `INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)`,
          [id, normalizedImages[i], i === 0 ? 1 : 0]
        );
      }

      await conn.query(`DELETE FROM product_specs WHERE product_id = ?`, [id]);

      const normalizedSpecs = Array.isArray(specs)
        ? specs
            .filter((item) => {
              if (!item) return false;
              const fieldId = Number(item.field_id);
              if (!Number.isFinite(fieldId) || fieldId <= 0) {
                return false;
              }
              return item.value !== undefined && item.value !== null;
            })
            .map((item) => ({
              field_id: Number(item.field_id),
              value: String(item.value).slice(0, 255),
            }))
        : [];

      for (let i = 0; i < normalizedSpecs.length; i += 1) {
        await conn.query(
          `INSERT INTO product_specs (product_id, field_id, value) VALUES (?, ?, ?)`,
          [id, normalizedSpecs[i].field_id, normalizedSpecs[i].value]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  },
  deleteAdmin: async (id) => {
    const conn = db.promise();
    try {
      await conn.beginTransaction();

      await conn.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);
      await conn.query(`DELETE FROM product_specs WHERE product_id = ?`, [id]);
      await conn.query(`DELETE FROM products WHERE id = ?`, [id]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  },
};


module.exports = Product;
