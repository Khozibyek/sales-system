const express = require("express");
const fs = require("fs");
const path = require("path")
const router = express.Router();

// Controller-ийн бүх функцийг destructure хэлбэрээр авна
const {
  addToCart,
  getCart,
  addFavorite,
  getFavorites,
  deleteItem
} = require("../controllers/user/cartController");

//  Сагс
router.post("/add", addToCart);
router.get("/:user_id", getCart);

//  Хадгалалт
router.post("/favorite/add", addFavorite);
router.get("/favorite/:user_id", getFavorites);

//  Устгах
router.delete("/delete/:id", deleteItem);

router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../data/address.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Address file read error:", err);
      return res.status(500).json({ error: "Failed to load address data" });
    }
    res.json(JSON.parse(data));
  });
});

module.exports = router;
