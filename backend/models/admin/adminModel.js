const db = require("../../config/db");

const TABLE_NAME = "admin";

const Admin = {
  findByEmail: (email, callback) => {
    const sql = `SELECT id, name, email, password FROM ${TABLE_NAME} WHERE email = ?`;
    db.query(sql, [email], callback);
  },
  findById: (id, callback) => {
    const sql = `SELECT id, name, email, password FROM ${TABLE_NAME} WHERE id = ?`;
    db.query(sql, [id], callback);
  },
  updatePassword: (id, hashedPassword, callback) => {
    const sql = `UPDATE ${TABLE_NAME} SET password = ? WHERE id = ?`;
    db.query(sql, [hashedPassword, id], callback);
  },
};

module.exports = Admin;
