const bcrypt = require("bcryptjs");
const db = require("../../config/db");
const User = require("../../models/user/userModel");
const Address = require("../../models/addressModel");

exports.getAllUsers = (req, res) => {
  User.findAll((err, result) => {
    if (err) {
      console.error("Admin get users error:", err.message);
      return res.status(500).json({ error: "Хэрэглэгчдийн жагсаалтыг татахад алдаа гарлаа." });
    }

    const users = (result || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      createdAt: row.created_at,
      active: row.active === undefined ? 1 : row.active,
    }));

    res.json({ users });
  });
};

exports.getUserById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID шаардлагатай." });
  }

  User.findById(id, (err, result) => {
    if (err) {
      console.error("Admin get user error:", err.message);
      return res.status(500).json({ error: "Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа." });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Хэрэглэгч олдсонгүй." });
    }

    const row = result[0];
    res.json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        active: row.active === undefined ? 1 : row.active,
        createdAt: row.created_at,
      },
    });
  });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID заавал шаардлагатай." });
  }

  db.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error("Admin delete user transaction error:", transactionErr.message);
      return res.status(500).json({ error: "Transaction эхлүүлэхэд алдаа гарлаа." });
    }

    db.query(
      "SELECT payment_id FROM orders WHERE user_id = ? AND payment_id IS NOT NULL",
      [id],
      (paymentSelectErr, paymentRows) => {
        if (paymentSelectErr) {
          console.error("Admin delete user payment select error:", paymentSelectErr.message);
          return db.rollback(() =>
            res.status(500).json({ error: "Төлбөрийн мэдээлэл уншихад алдаа гарлаа." })
          );
        }

        const paymentIds = paymentRows.map((row) => row.payment_id);

        const steps = [
          {
            sql: `
              DELETE FROM order_items
              WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = ?)
            `,
            params: [id],
          },
          paymentIds.length
            ? {
                sql: `UPDATE orders SET payment_id = NULL WHERE user_id = ? AND payment_id IN (${paymentIds
                  .map(() => "?")
                  .join(", ")})`,
                params: [id, ...paymentIds],
              }
            : null,
          paymentIds.length
            ? {
                sql: `DELETE FROM payments WHERE payment_id IN (${paymentIds.map(() => "?").join(", ")})`,
                params: paymentIds,
              }
            : null,
          {
            sql: "DELETE FROM orders WHERE user_id = ?",
            params: [id],
          },
          {
            sql: "DELETE FROM favorites WHERE user_id = ?",
            params: [id],
          },
          {
            sql: "DELETE FROM cart WHERE user_id = ?",
            params: [id],
          },
          {
            sql: "DELETE FROM addresses WHERE user_id = ?",
            params: [id],
          },
          {
            sql: "DELETE FROM users WHERE id = ?",
            params: [id],
          },
        ].filter(Boolean);

        const filteredSteps = steps.filter(Boolean);

        const runStep = (index = 0) => {
          if (index >= filteredSteps.length) {
            return db.commit((commitErr) => {
              if (commitErr) {
                console.error("Admin delete user commit error:", commitErr.message);
                return db.rollback(() =>
                  res.status(500).json({ error: "Commit хийхэд алдаа гарлаа." })
                );
              }
              res.json({ message: "Хэрэглэгч болон холбоотой мэдээллүүдийг амжилттай устгалаа." });
            });
          }

          const { sql, params } = filteredSteps[index];
          db.query(sql, params, (queryErr, result) => {
            if (queryErr) {
              console.error("Admin delete user step error:", queryErr.message);
              return db.rollback(() =>
                res.status(500).json({ error: "Хэрэглэгч устгах явцад алдаа гарлаа." })
              );
            }

            if (index === steps.length - 1 && result?.affectedRows === 0) {
              return db.rollback(() => res.status(404).json({ error: "Хэрэглэгч олдсонгүй." }));
            }

            runStep(index + 1);
          });
        };

        runStep();
      }
    );
  });
};

exports.updateUserStatus = (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (!id || active === undefined) {
    return res.status(400).json({ error: "ID болон active утга шаардлагатай." });
  }

  const normalized = Number(active) ? 1 : 0;

  User.updateActive(id, normalized, (err, result) => {
    if (err) {
      console.error("Admin update user status error:", err.message);
      return res.status(500).json({ error: "Статус шинэчлэхэд алдаа гарлаа." });
    }

    if (result?.affectedRows === 0) {
      return res.status(404).json({ error: "Хэрэглэгч олдсонгүй." });
    }

    res.json({ message: "Хэрэглэгчийн статус шинэчлэгдлээ.", active: normalized });
  });
};

exports.createUser = (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Нэр, имэйл, нууц үг шаардлагатай." });
  }

  User.findByEmail(email, async (findErr, existing) => {
    if (findErr) {
      console.error("Admin create user validation error:", findErr.message);
      return res.status(500).json({ error: "Имэйл шалгахад алдаа гарлаа." });
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Энэ имэйлээр бүртгэлтэй хэрэглэгч байна." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 8);
      const payload = { name, email, phone: phone || null, password: hashedPassword };

      User.create(payload, (createErr, result) => {
        if (createErr) {
          console.error("Admin create user error:", createErr.message);
          return res.status(500).json({ error: "Хэрэглэгч нэмэхэд алдаа гарлаа." });
        }

        res.status(201).json({
          message: "Хэрэглэгч амжилттай нэмэгдлээ.",
          user: {
            id: result?.insertId,
            name,
            email,
            phone: phone || null,
          },
        });
      });
    } catch (hashErr) {
      console.error("Admin create user hash error:", hashErr.message);
      res.status(500).json({ error: "Нууц үг боловсруулахад алдаа гарлаа." });
    }
  });
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, active } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID шаардлагатай." });
  }

  if (!name || !email) {
    return res.status(400).json({ error: "Нэр болон имэйл шаардлагатай." });
  }

  db.query(
    "SELECT id FROM users WHERE email = ? AND id != ?",
    [email, id],
    async (checkErr, rows) => {
      if (checkErr) {
        console.error("Admin update user email check error:", checkErr.message);
        return res.status(500).json({ error: "Имэйл шалгах явцад алдаа гарлаа." });
      }

      if (rows && rows.length > 0) {
        return res.status(400).json({ error: "Энэ имэйлээр өөр хэрэглэгч бүртгэлтэй байна." });
      }

      try {
        let updates = { name, email, phone: phone || null, active: Number(active) ? 1 : 0 };

        if (password) {
          updates.password = await bcrypt.hash(password, 10);
        }

        const queries = [];

        if (updates.password) {
          queries.push({
            sql: "UPDATE users SET password = ? WHERE id = ?",
            params: [updates.password, id],
          });
        }

        queries.push({
          sql: "UPDATE users SET name = ?, email = ?, phone = ?, active = ? WHERE id = ?",
          params: [updates.name, updates.email, updates.phone, updates.active, id],
        });

        const run = (index = 0) => {
          if (index >= queries.length) {
            return res.json({ message: "Хэрэглэгчийн мэдээлэл шинэчлэгдлээ." });
          }

          const { sql, params } = queries[index];
          db.query(sql, params, (err) => {
            if (err) {
              console.error("Admin update user error:", err.message);
              return res.status(500).json({ error: "Хэрэглэгчийн мэдээллийг шинэчлэхэд алдаа гарлаа." });
            }
            run(index + 1);
          });
        };

        run();
      } catch (hashErr) {
        console.error("Admin update user hash error:", hashErr.message);
        res.status(500).json({ error: "Нууц үг боловсруулахад алдаа гарлаа." });
      }
    }
  );
}; 

exports.getUserAddress = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID шаардлагатай." });
  }

  try {
    const data = await Address.getUserAddress(id);
    res.json({
      address: data.address,
      phone: data.phone,
    });
  } catch (err) {
    console.error("Admin get user address error:", err.message);
    res.status(500).json({ error: "Хаягийн мэдээлэл авахад алдаа гарлаа." });
  }
};

exports.updateUserAddress = async (req, res) => {
  const { id } = req.params;
  const { city, district, subdistrict, addressDetail, altPhone } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID шаардлагатай." });
  }

  if (!city || !district || !subdistrict) {
    return res.status(400).json({ error: "Хот, дүүрэг, хороо талбаруудыг бөглөнө үү." });
  }

  try {
    await Address.upsertAddress(
      id,
      city,
      district,
      subdistrict,
      addressDetail || "",
      altPhone || null
    );

    res.json({ message: "Хаягийн мэдээлэл амжилттай хадгалагдлаа." });
  } catch (err) {
    console.error("Admin update user address error:", err.message);
    res.status(500).json({ error: "Хаягийн мэдээлэл хадгалахад алдаа гарлаа." });
  }
};
