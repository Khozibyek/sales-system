const OrderModel = require("../../models/orderModel");

const ALLOWED_ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];

exports.listOrders = async (req, res) => {
  try {
    const orders = await OrderModel.getAllAdmin();
    res.json({ orders });
  } catch (err) {
    console.error("Admin list orders error:", err.message);
    res.status(500).json({ error: "Захиалгуудыг татахад алдаа гарлаа." });
  }
};

exports.getOrderDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderModel.getByIdAdmin(id);
    if (!order) {
      return res.status(404).json({ error: "Захиалга олдсонгүй." });
    }
    res.json({ order });
  } catch (err) {
    console.error("Admin get order detail error:", err.message);
    res.status(500).json({ error: "Захиалга татахад алдаа гарлаа." });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const status = req.body?.status ? String(req.body.status).toUpperCase() : "";

  if (!status || !ALLOWED_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Төлөв буруу эсвэл дутуу байна." });
  }

  try {
    const updated = await OrderModel.updateStatusAdmin(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Захиалга олдсонгүй." });
    }
    res.json({ message: "Төлөв шинэчлэгдлээ.", status });
  } catch (err) {
    console.error("Admin update order status error:", err.message);
    res.status(500).json({ error: "Төлөв шинэчлэхэд алдаа гарлаа." });
  }
};
