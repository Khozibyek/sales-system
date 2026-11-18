const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/admin/adminModel");

const signAdminToken = (payload) => {
  const secret = process.env.ADMIN_JWT_SECRET || "adminSecretKey";
  const options = { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "2h" };
  return jwt.sign(payload, secret, options);
};

exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "И-мэйл болон нууц үгээ оруулна уу." });
  }

  Admin.findByEmail(email, async (err, result) => {
    if (err) {
      console.error("Admin login DB error:", err.message);
      return res.status(500).json({ error: "Системийн алдаа гарлаа." });
    }

    if (!result || result.length === 0) {
      return res.status(400).json({ error: "И-мэйл эсвэл нууц үг буруу байна." });
    }

    const admin = result[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ error: "И-мэйл эсвэл нууц үг буруу байна." });
    }

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "admin",
    });

    res.status(200).json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  });
};

exports.getAdminProfile = (req, res) => {
  const { admin } = req;

  if (!admin) {
    return res.status(401).json({ error: "Эрхгүй хандалт." });
  }

  res.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
  });
};

exports.changePassword = (req, res) => {
  const adminContext = req.admin;

  if (!adminContext?.id) {
    return res.status(401).json({ error: "Эрхгүй хандалт." });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Бүх талбарыг бөглөнө үү." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Шинэ нууц үг баталгаажилттай таарахгүй байна." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." });
  }

  Admin.findById(adminContext.id, async (err, result) => {
    if (err) {
      console.error("Admin change password DB error:", err.message);
      return res.status(500).json({ error: "Системийн алдаа гарлаа." });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Админ олдсонгүй." });
    }

    const adminRecord = result[0];
    const isMatch = await bcrypt.compare(currentPassword, adminRecord.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Одоогийн нууц үг буруу байна." });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      Admin.updatePassword(adminRecord.id, hashedPassword, (updateErr) => {
        if (updateErr) {
          console.error("Admin password update error:", updateErr.message);
          return res.status(500).json({ error: "Нууц үг шинэчлэхэд алдаа гарлаа." });
        }

        res.json({ message: "Нууц үг амжилттай шинэчлэгдлээ." });
      });
    } catch (hashErr) {
      console.error("Admin password hash error:", hashErr.message);
      res.status(500).json({ error: "Нууц үг шифрлэхэд алдаа гарлаа." });
    }
  });
};
