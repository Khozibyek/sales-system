
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user/userModel");

/*=========== user register ===========*/
exports.registerUser = (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  // Талбар шалгах
  if (!name || !phone || !email || !password)
    return res.status(400).json({ error: "Бүх талбарыг бөглөнө үү!" });

  if (password !== confirmPassword) {
      return res.status(400).json({ error: "Нууц үг таарахгүй байна" });
    }

  //  Имэйл бүртгэлтэй эсэхийг шалгах
  User.findByEmail(email, async (err, result) => {
    if (err) return res.status(500).json({ error: "Өгөгдлийн сангийн алдаа" });

    if (result.length > 0)
      return res.status(400).json({ error: "И-мэйл хаяг бүртгэлтэй байна" });

    //  Нууц үг шифрлэх
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Хэрэглэгч үүсгэх
    const newUser = { name, email, phone, password: hashedPassword };
    User.create(newUser, (err) => {
      if (err) return res.status(500).json({ error: "Бүртгэл хадгалахад алдаа гарлаа" });
      res.status(201).json({ message: "Бүртгэл амжилттай!" });
    });
  });
};

/*=========== user login ===========*/

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

   if (!email || !password)
    return res
      .status(400)
      .json({ field: "general", error: "Бүх талбарыг бөглөнө үү!" });

      User.findByEmail(email, async (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ field: "general", error: "Өгөгдлийн сангийн алдаа" });

    if (result.length === 0)
      return res
        .status(400)
        .json({ field: "email", error: "И-мэйл бүртгэлгүй байна" });

    const user = result[0];

    // Идэвхгүй болгосон хэрэглэгч нэвтрэх эрхгүй
    const isActive =
      user.active === 1 ||
      user.active === true ||
      String(user.active) === "1";
    if (!isActive) {
      return res
        .status(403)
        .json({ field: "general", error: "Таны нэвтрэх эрх хаагдсан байна." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ field: "password", error: "Нууц үг буруу байна" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "secretKey",
      { expiresIn: "1h" }
    );

      res.status(200).json({
  token,
  user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
});
  });
};

/*=================== user profile ===========*/

exports.profileUser = (req, res) => {
  const userId = req.params.id;

  User.findById(userId, (err, result) => {
    if (err) {
      console.error("DB error:", err.message);
      return res.status(500).json({ success: false, message: "DB error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: result[0] });
  });
};
