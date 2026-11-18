// models/userModel.js
const db = require("../../config/db");

const User = {
  // Имэйл бүртгэлтэй эсэхийг шалгах
  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], callback);
  },
  // → ID-аар хайх
  findById: (id, callback) => {
    const sql = "SELECT id, name, email, phone, active FROM users WHERE id = ?";
    db.query(sql, [id], callback);
  },

  // Шинэ хэрэглэгч нэмэх
  create: (userData, callback) => {
    const { name, email, phone, password } = userData;
    db.query(
      "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
      [name, email, phone, password],
      callback
    );
  },
  findAll: (callback) => {
    const sql = `
      SELECT
        id,
        name,
        email,
        phone,
        created_at,
        active
      FROM users
      ORDER BY created_at DESC
    `;
    db.query(sql, callback);
  },
  deleteById: (id, callback) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [id], callback);
  },
  updateActive: (id, active, callback) => {
    const sql = "UPDATE users SET active = ? WHERE id = ?";
    db.query(sql, [active, id], callback);
  },
  updateUser: (id, data, callback) => {
    const { name, email, phone, active } = data;
    const sql = "UPDATE users SET name = ?, email = ?, phone = ?, active = ? WHERE id = ?";
    db.query(sql, [name, email, phone, active, id], callback);
  },
};


module.exports = User;
