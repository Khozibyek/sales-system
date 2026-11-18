const db = require("../../config/db");

const Dashboard = {
  getUserCount: (callback) => {
    const sql = "SELECT COUNT(*) AS totalUsers FROM users";
    db.query(sql, callback);
  },
  getProductCount: (callback) => {
    const sql = "SELECT COUNT(*) AS totalProducts FROM products";
    db.query(sql, callback);
  },
  getActiveOrderCount: (callback) => {
    const activeStatuses = ["PENDING", "PROCESSING"];
    const placeholders = activeStatuses.map(() => "?").join(", ");
    const sql = `SELECT COUNT(*) AS activeOrders FROM orders WHERE order_status IN (${placeholders})`;
    db.query(sql, activeStatuses, callback);
  },
  getRevenueSummary: (callback) => {
    const completedStatuses = ["COMPLETED"];
    const placeholders = completedStatuses.map(() => "?").join(", ");
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_price ELSE 0 END), 0) AS revenueToday,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN total_price ELSE 0 END), 0) AS revenueYesterday
      FROM orders
      WHERE order_status IN (${placeholders})
    `;
    db.query(sql, completedStatuses, callback);
  },
  getRecentOrders: (limit, callback) => {
    const sql = `
      SELECT 
        o.order_id,
        o.total_price,
        UPPER(o.order_status) AS order_status,
        o.created_at,
        u.name AS customer_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    db.query(sql, [limit], callback);
  },
};

module.exports = Dashboard;
