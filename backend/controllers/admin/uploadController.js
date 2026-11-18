// controllers/admin/uploadController.js
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const UploadModel = require("../../models/admin/uploadModel");

// 🔧 Upload тохиргоо
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

exports.uploadImage = [
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Файл олдсонгүй" });
      }

      const productId = req.body.product_id || null;
      const imageUrl = `uploads/${req.file.filename}`;

      // Хэрвээ product_id ирсэн бол DB-д хадгална
      if (productId) {
        await UploadModel.saveImagePath(productId, imageUrl, false);
      }

      res.json({ success: true, imageUrl });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload хийхэд алдаа гарлаа." });
    }
  },
];

// ✅ Зураг устгах controller
exports.deleteImage = async (req, res) => {
  try {
    const { product_id, image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: "Зургийн URL ирсэнгүй" });
    }

    // DB-оос устгах
    await UploadModel.deleteImagePath(product_id, image_url);

    // Файлын зам тодорхойлох
    const fullPath = path.join(__dirname, "../../..", image_url);

    // Файл устгах
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(" Файл устгагдлаа:", fullPath);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(" Зураг устгах алдаа:", err);
    res.status(500).json({ error: "Зураг устгахад алдаа гарлаа" });
  }
};
