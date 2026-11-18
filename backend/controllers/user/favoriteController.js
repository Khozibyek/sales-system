const favoritesModel = require("../../models/favoritesModel");

//  Toggle favorite (нэмэх / хасах)
exports.toggleFavorite = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id)
      return res.status(400).json({ error: "user_id болон product_id шаардлагатай" });

    const result = await favoritesModel.toggleFavorite(user_id, product_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Favorite toggle error:", err);
    res.status(500).json({ error: "Серверийн алдаа гарлаа" });
  }
};

// 🧠 Хэрэглэгчийн дуртай бараанууд
exports.getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await favoritesModel.getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ error: "Серверийн алдаа гарлаа" });
  }
};
