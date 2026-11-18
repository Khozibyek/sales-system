import React, { useEffect, useState } from "react";
import axios from "axios";

const STATUS_MESSAGES = {
  PENDING: { label: "Шинэ", className: "pending" },
  PROCESSING: { label: "Боловсруулж байна", className: "processing" },
  COMPLETED: { label: "Гүйцэтгэсэн", className: "completed" },
  CANCELLED: { label: "Цуцлагдсан", className: "cancelled" },
};

export default function Orders() {
  const userId = localStorage.getItem("userId");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`http://localhost:5050/api/orders/user/${userId}/with-items`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Захиалга татах алдаа:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return <p className="orders-empty">⚠️ Нэвтэрч орно уу.</p>;
  if (loading) return <p className="orders-empty">⏳ Уншиж байна...</p>;
  if (orders.length === 0)
    return <p className="orders-empty">🛍 Одоогоор таны захиалга хоосон байна.</p>;

  return (
    <div className="orders-page">
      <h2 className="orders-title">🛒 Миний захиалсан бараанууд</h2>

      <div className="orders-grid">
        {orders.map((order) => (
          <div className="order-card" key={order.order_id}>
            <div className="order-top">
              <h4>Захиалга №{order.order_id}</h4>
              {(() => {
                const statusKey = (order.order_status || "").toUpperCase();
                const info = STATUS_MESSAGES[statusKey] || {
                  label: statusKey || "",
                  className: "pending",
                };
                return (
                  <span className={`order-status ${info.className}`}>
                    {info.label}
                  </span>
                );
              })()}
            </div>

            <div className="order-items">
              {order.items.map((it) => (
                <div className="order-item" key={it.item_id}>
                  <img
                    src={`http://localhost:5050/${it.image?.replace(/^\/+/, "")}`}
                    alt={it.name}
                    className="order-img"
                  />
                  <div className="item-info">
                    <p className="item-name">{it.name}</p>
                    <p className="item-meta">
                      {it.qty} × {Number(it.price).toLocaleString()} ₮
                    </p>
                  </div>
                  <div className="item-total">
                    {(it.qty * it.price).toLocaleString()} ₮
                  </div>
                </div>
              ))}
            </div>

            <div className="order-bottom">
              <p className="order-date">
                📅 {new Date(order.created_at).toLocaleDateString("mn-MN")}
              </p>
              <p className="order-total">
                Нийт:{" "}
                <strong>{Number(order.total_price).toLocaleString()} ₮</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
