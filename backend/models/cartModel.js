const db = require("../config/db");

const CartModel = {
  //  Сагсанд бараа нэмэх
 addCartItem: (userId, productId, quantity = 1, callback) => {
  const sqlCheck = `
    SELECT * FROM cart WHERE user_id=? AND product_id=?
  `;
  db.query(sqlCheck, [userId, productId], (err, rows) => {
    if (err) return callback(err);

    if (rows.length > 0) {
      // Хэрвээ өмнө нь байгаа бол тоо ширхэгийг нэмэгдүүлэх
      const sqlUpdate = `
        UPDATE cart 
        SET quantity = quantity + ? 
        WHERE user_id=? AND product_id=?
      `;
      db.query(sqlUpdate, [quantity, userId, productId], callback);
    } else {
      // Хэрвээ байхгүй бол шинээр нэмэх
      const sqlInsert = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `;
      db.query(sqlInsert, [userId, productId, quantity], callback);
    }
  });
},


  //  Хадгалах
  addFavorite: (userId, productId, callback) => {
    const sql = `
      INSERT IGNORE INTO user_items (user_id, product_id, type)
      VALUES (?, ?, 'favorite')
    `;
    db.query(sql, [userId, productId], callback);
  },

  // Хэрэглэгчийн сагс авах
 getCartItems: (userId, callback) => {
  const sql = `
    SELECT 
      c.id AS cart_id,
      p.id AS product_id,
      p.name,
      p.price,
      p.discount_percent,
      p.stock,
      b.name AS brand_name,
      m.name AS model_name,
      c.quantity,
      (p.price * c.quantity) AS total_price,
      i.image_url AS main_image
    FROM cart c
    JOIN products p ON c.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN models m ON p.model_id = m.id
    LEFT JOIN product_images i 
      ON i.product_id = p.id AND i.is_main = 1
    WHERE c.user_id = ?;
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("getCartItems query error:", err);
      return callback(err);
    }
    callback(null, rows);
  });
},


  // Хэрэглэгчийн хадгалсан бараа авах
  getFavorites: (userId, callback) => {
    const sql = `
      SELECT 
        u.id AS item_id,
        p.id AS product_id,
        p.name,
        p.price,
        p.main_image
      FROM user_items u
      JOIN products p ON u.product_id = p.id
      WHERE u.user_id=? AND u.type='favorite'
    `;
    db.query(sql, [userId], callback);
  },

  //  Сагс эсвэл хадгалалтаас устгах
  deleteItem: (cart_id, callback) => {
  const sql = "DELETE FROM cart WHERE id = ?";
  db.query(sql, [cart_id], (err, result) => {
    if (err) {
      console.error("Error deleting cart item:", err);
      return callback(err);
    }
    callback(null, result);
  });
},

};

module.exports = CartModel;
