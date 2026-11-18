const Dashboard = require("../../models/admin/dashboardModel");

exports.getOverviewStats = (req, res) => {
  Dashboard.getUserCount((userErr, userResult) => {
    if (userErr) {
      console.error("Dashboard user count error:", userErr.message);
      return res.status(500).json({ error: "Хэрэглэгчийн тоо татахад алдаа гарлаа." });
    }

    Dashboard.getProductCount((productErr, productResult) => {
      if (productErr) {
        console.error("Dashboard product count error:", productErr.message);
        return res.status(500).json({ error: "Бүтээгдэхүүний тоо татахад алдаа гарлаа." });
      }

      Dashboard.getActiveOrderCount((orderErr, orderResult) => {
        if (orderErr) {
          console.error("Dashboard active orders error:", orderErr.message);
          return res.status(500).json({ error: "Идэвхтэй захиалгын тоо татахад алдаа гарлаа." });
        }

        Dashboard.getRevenueSummary((revenueErr, revenueResult) => {
          if (revenueErr) {
            console.error("Dashboard revenue error:", revenueErr.message);
            return res.status(500).json({ error: "Орлогын мэдээлэл татахад алдаа гарлаа." });
          }

          const totalUsers = userResult?.[0]?.totalUsers || 0;
          const totalProducts = productResult?.[0]?.totalProducts || 0;
          const activeOrders = orderResult?.[0]?.activeOrders || 0;
          const revenueToday = Number(revenueResult?.[0]?.revenueToday || 0);
          const revenueYesterday = Number(revenueResult?.[0]?.revenueYesterday || 0);

          res.json({
            totalUsers,
            totalProducts,
            activeOrders,
            revenueToday,
            revenueYesterday,
          });
        });
      });
    });
  });
};

exports.getRecentOrders = (req, res) => {
  const limit = Number(req.query.limit) || 6;

  Dashboard.getRecentOrders(limit, (err, result) => {
    if (err) {
      console.error("Dashboard recent orders error:", err.message);
      return res.status(500).json({ error: "Сүүлийн захиалгуудыг татахад алдаа гарлаа." });
    }

    const orders = (result || []).map((row) => ({
      id: row.order_id,
      total: Number(row.total_price || 0),
      status: row.order_status,
      createdAt: row.created_at,
      customer: row.customer_name || "Үл мэдэгдэх",
    }));

    res.json({ orders });
  });
};
