const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/user/favoriteController");

//  Дуртай бараа нэмэх / хасах
router.post("/toggle", favoriteController.toggleFavorite);

// Хэрэглэгчийн дуртай бараануудыг авах
router.get("/user/:userId", favoriteController.getUserFavorites);

module.exports = router;
