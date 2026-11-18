// models/admin/uploadModel.js
const db = require("../../config/db");

const UploadModel = {
  saveImagePath: async (productId, imageUrl, isMain = false) => {
    const conn = db.promise();
    await conn.query(
      `INSERT INTO product_images (product_id, image_url, is_main)
       VALUES (?, ?, ?)`,
      [productId, imageUrl, isMain ? 1 : 0]
    );
  },
  
    deleteImagePath: async (productId, imageUrl) => {
    const conn = db.promise();
    await conn.query(
      `DELETE FROM product_images WHERE product_id = ? AND image_url = ?`,
      [productId, imageUrl]
    );
    console.log("🗑 DB-оос устгагдлаа:", imageUrl);
  },
};


module.exports = UploadModel;
