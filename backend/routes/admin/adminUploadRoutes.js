const express = require("express");
const { uploadImage, deleteImage } = require("../../controllers/admin/uploadController");

const router = express.Router();

// зөв controller-г ашиглах
router.post("/image", uploadImage);
router.post("/delete", deleteImage);

module.exports = router;
