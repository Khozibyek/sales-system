const express = require("express");
const router = express.Router();
const addressController = require("../controllers/user/addressController");

//  Монголын хаягийн JSON авах
// router.get("/", addressController.getAddressData);

// Хэрэглэгчийн бүртгэлтэй хаяг + Монголын хаягийн жагсаалт
router.get("/full/:userId", addressController.getUserFullAddressData);

//  Хаяг оруулах / шинэчлэх
router.post("/upsert", addressController.upsertAddress);

module.exports = router;
