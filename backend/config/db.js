// config/db.js
const mysql = require("mysql2");
require("dotenv").config();

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Холболт шалгах
db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
  } else {
    console.log("Connected to MySQL Database!");
  }
});

module.exports = db;
