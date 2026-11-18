const db = require("../config/db");

//  Дуртай бараа toggle хийх
exports.toggleFavorite = async (userId, productId) => {
  const [exists] = await db
    .promise()
    .query("SELECT * FROM favorites WHERE user_id=? AND product_id=?", [userId, productId]);

  if (exists.length > 0) {
    // Хэрвээ байгаа бол устгана
    await db
      .promise()
      .query("DELETE FROM favorites WHERE user_id=? AND product_id=?", [userId, productId]);
    return { favorited: false };
  } else {
    // Байхгүй бол нэмнэ
    await db
      .promise()
      .query("INSERT INTO favorites (user_id, product_id) VALUES (?, ?)", [userId, productId]);
    return { favorited: true };
  }
};

// 🧠 Хэрэглэгчийн бүх дуртай бараа татах
exports.getUserFavorites = async (userId) => {
  const [rows] = await db.promise().query(
    `
    SELECT 
      p.id, p.name, p.price,
      (SELECT pi.image_url 
       FROM product_images pi 
       WHERE pi.product_id = p.id AND pi.is_main = 1
       LIMIT 1) AS main_image
    FROM favorites f
    LEFT JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
    `,
    [userId]
  );
  return rows;
};
