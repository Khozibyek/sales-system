const fs = require("fs");
const path = require("path");
const addressModel = require("../../models/addressModel"); 

//  Хаяг нэмэх эсвэл шинэчлэх
exports.upsertAddress = async (req, res) => {
  try {
    const { user_id, city, district, subdistrict, address_detail, alt_phone } = req.body;

    if (!user_id || !city || !district || !subdistrict || !address_detail) {
      return res.status(400).json({ error: "Бүх хаягийн талбарыг бөглөнө үү" });
    }

    const addressId = await addressModel.upsertAddress(
      user_id,
      city,
      district,
      subdistrict,
      address_detail,
      alt_phone
    );

    res.status(200).json({
      message: "Хаяг амжилттай хадгалагдлаа",
      address_id: addressId,
    });
  } catch (err) {
    console.error(" Хаяг хадгалах үед алдаа:", err);
    res.status(500).json({ error: "Серверийн алдаа гарлаа" });
  }
};

//  Хэрэглэгчийн бүрэн хаягийн мэдээлэл (DB + JSON)
exports.getUserFullAddressData = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await addressModel.getUserAddress(userId);

    const filePath = path.join(__dirname, "../../data/address.json");
    const rawData = fs.readFileSync(filePath, "utf8");
    const addressData = JSON.parse(rawData);

    res.status(200).json({
      addressData,
      userAddress: result.address,
      phone: String(result.phone || ""),
      found: !!result.address,
    });
  } catch (err) {
    console.error(" Хаягийн мэдээлэл дуудах алдаа:", err);
    res.status(500).json({ error: "Хаягийн мэдээлэл уншихад алдаа гарлаа" });
  }
};
