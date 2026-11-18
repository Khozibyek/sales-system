const Cart = require("../../models/cartModel");
const fs = require("fs");
const path = require("path");

exports.addToCart = (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  Cart.addCartItem(user_id, product_id, quantity, (err) => {
    if (err) return res.status(500).json({ error: "Сагсанд нэмэхэд алдаа" });
    res.json({ message: "Сагсанд амжилттай нэмэгдлээ" });
  });
};

exports.addFavorite = (req, res) => {
  const { user_id, product_id } = req.body;
  Cart.addFavorite(user_id, product_id, (err) => {
    if (err) return res.status(500).json({ error: "Хадгалах алдаа" });
    res.json({ message: "Бараа хадгалагдлаа" });
  });
};

exports.getCart = (req, res) => {
  const { user_id } = req.params;
  Cart.getCartItems(user_id, (err, rows) => {
    if (err) return res.status(500).json({ error: "Сагс авах алдаа" });
    res.json(rows);
  });
};

exports.getFavorites = (req, res) => {
  const { user_id } = req.params;
  Cart.getFavorites(user_id, (err, rows) => {
    if (err) return res.status(500).json({ error: "Хадгалсан бараа авах алдаа" });
    res.json(rows);
  });
};

exports.deleteItem = (req, res) => {
  const { id } = req.params;
  Cart.deleteItem(id, (err) => {
    if (err) return res.status(500).json({ error: "Устгах алдаа" });
    res.json({ message: "Амжилттай устгалаа" });
  });
};

exports.getUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db
      .promise()
      .query("SELECT * FROM addresses WHERE user_id = ?", [userId]);

    const [userRows] = await db
      .promise()
      .query("SELECT phone FROM users WHERE id = ?", [userId]);

    if (rows.length > 0) {
      // Хаяг байгаа → address мэдээллийг буцаана
      return res.json({
        found: true,
        address: rows[0],
        phone: userRows.length ? userRows[0].phone : "",
      });
    } else {
      // Хаяг байхгүй → зөвхөн утасны дугаар буцаана
      return res.json({
        found: false,
        address: null,
        phone: userRows.length ? userRows[0].phone : "",
      });
    }
  } catch (err) {
    console.error("Хэрэглэгчийн хаяг дуудах алдаа:", err);
    res.status(500).json({ error: "Серверийн алдаа гарлаа" });
  }
};