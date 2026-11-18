const db = require("../config/db");

// 🏠 Хаяг оруулах эсвэл шинэчлэх
exports.upsertAddress = async (userId, city, district, subdistrict, addressDetail, altPhone) => {
  return new Promise(async (resolve, reject) => {
    try {
      const [rows] = await db.promise().query(
        "SELECT address_id FROM addresses WHERE user_id = ?",
        [userId]
      );

      let addressId;
      if (rows.length > 0) {
        addressId = rows[0].address_id;
        await db.promise().query(
          `UPDATE addresses 
           SET city=?, district=?, subdistrict=?, address_detail=?, alt_phone=? 
           WHERE address_id=?`,
          [city, district, subdistrict, addressDetail, altPhone, addressId]
        );
      } else {
        const [result] = await db.promise().query(
          `INSERT INTO addresses (user_id, city, district, subdistrict, address_detail, alt_phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, city, district, subdistrict, addressDetail, altPhone]
        );
        addressId = result.insertId;
      }

      resolve(addressId);
    } catch (err) {
      reject(err);
    }
  });
};

// 🏙️ Хэрэглэгчийн хаяг ба утас авах
exports.getUserAddress = async (userId) => {
  try {
    const [addrRows] = await db.promise().query(
      "SELECT * FROM addresses WHERE user_id = ?",
      [userId]
    );

    const [userRows] = await db.promise().query(
      "SELECT phone FROM users WHERE id = ?",
      [userId]
    );

    return {
      address: addrRows.length ? addrRows[0] : null,
      phone: userRows.length ? userRows[0].phone : "",
    };
  } catch (err) {
    throw err;
  }
};
