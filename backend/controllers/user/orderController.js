const OrderModel = require("../../models/orderModel");

// 💳 Захиалга үүсгэх Controller
exports.createOrder = async (req, res) => {
  try {
    const { user_id, address_id, total_price, payment_method, cart_items } = req.body;

    // Талбарууд шалгах
    if (!user_id || !address_id || !total_price || !cart_items?.length) {
      return res.status(400).json({ error: "Бүх талбарыг бөглөнө үү" });
    }

    // Model-ийг дуудаж, мэдээлэл оруулах
    const result = await OrderModel.createOrder(
      user_id,
      address_id,
      total_price,
      payment_method || "Бэлнээр",
      cart_items
    );

    // Хариу буцаах
    res.status(200).json({
      message: "✅ Захиалга амжилттай бүртгэгдлээ",
      order_id: result.orderId,
      payment_id: result.paymentId,
    });
  } catch (err) {
    console.error("❌ Order creation error:", err);
    res.status(500).json({ error: "Серверийн алдаа гарлаа" });
  }
};

//  Хэрэглэгчийн бүх захиалга авах
exports.getUserOrdersWithItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await OrderModel.getUserOrdersWithItems(userId);
    res.status(200).json(orders);
  } catch (err) {
    console.error("Захиалга + бараа татах алдаа:", err);
    res.status(500).json({ error: "Захиалга дуудах үед алдаа гарлаа" });
  }
};