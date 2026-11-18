const jwt = require("jsonwebtoken");

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Нэвтрэх шаардлагатай." });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.ADMIN_JWT_SECRET || "adminSecretKey";

  try {
    const decoded = jwt.verify(token, secret);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Энэ үйлдлийг хийх эрхгүй." });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Admin token verify error:", error.message);
    return res.status(401).json({ error: "Нэвтрэх мэдээлэл хүчинтэй биш байна." });
  }
};

module.exports = verifyAdminToken;
