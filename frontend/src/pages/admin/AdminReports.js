import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/admin-reports.css";

const STATUS_LABELS = {
  PENDING: "Шинэ",
  PROCESSING: "Боловсруулж байна",
  COMPLETED: "Гүйцэтгэсэн",
  CANCELLED: "Цуцлагдсан",
};

const AdminReports = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatOrderCode = (code) => {
    if (!code) return "-";
    const match = String(code).match(/(\d+)/);
    return match ? String(Number(match[1])) : code;
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setLoading(true);
    Promise.all([
      fetch("http://localhost:5050/admin/dashboard/overview", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("http://localhost:5050/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([overviewData, ordersData]) => {
        setOverview(overviewData || {});
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setError("");
      })
      .catch(() => setError("Тайлангийн мэдээлэл татахад алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const aggregates = useMemo(() => {
    const totalOrders = orders.length;
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );
    const today = new Date();
    const revenueToday = orders.reduce((sum, order) => {
      if (!order.created_at) return sum;
      const d = new Date(order.created_at);
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      return isToday ? sum + Number(order.total_amount || 0) : sum;
    }, 0);

    return {
      totalOrders,
      revenue,
      revenueToday,
    };
  }, [orders]);

  const salesByPeriod = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    let dayTotal = 0;
    let monthTotal = 0;
    let yearTotal = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;
      const d = new Date(order.created_at);
      const amount = Number(order.total_amount || 0);
      if (d.getFullYear() === year) {
        yearTotal += amount;
        if (d.getMonth() === month) {
          monthTotal += amount;
          if (d.getDate() === today.getDate()) {
            dayTotal += amount;
          }
        }
      }
    });

    return {
      day: dayTotal,
      month: monthTotal,
      year: yearTotal,
    };
  }, [orders]);

  return (
    <div className="admin-reports-page">
      <div className="reports-header">
        <div>
          <h1>Тайлан</h1>
          <p>Захиалга, орлогын товч мэдээлэл</p>
        </div>
        <div className="reports-actions">
          <button className="ghost-btn" onClick={() => navigate(-1)}>
            Буцах
          </button>
        </div>
      </div>

      {loading ? (
        <p className="reports-placeholder">Ачаалж байна...</p>
      ) : error ? (
        <p className="reports-placeholder error">{error}</p>
      ) : (
        <>
          <div className="reports-section">
            <div className="section-header">
              <h3>Борлуулалтын тайлан</h3>
            </div>
            <div className="reports-metrics">
              <div className="report-card">
                <p className="report-label">Өнөөдөр</p>
                <p className="report-value">
                  {Number(salesByPeriod.day || 0).toLocaleString()}₮
                </p>
              </div>
              <div className="report-card">
                <p className="report-label">Энэ сар</p>
                <p className="report-value">
                  {Number(salesByPeriod.month || 0).toLocaleString()}₮
                </p>
              </div>
              <div className="report-card">
                <p className="report-label">Энэ жил</p>
                <p className="report-value">
                  {Number(salesByPeriod.year || 0).toLocaleString()}₮
                </p>
              </div>
              <div className="report-card">
                <p className="report-label">Нийт захиалга</p>
                <p className="report-value">{aggregates.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="reports-section">
            <div className="section-header">
              <h3>Борлуулалтын дэлгэрэнгүй</h3>
              <button className="ghost-btn" onClick={() => navigate("/admin/orders")}>
                Бүрэн жагсаалт
              </button>
            </div>
            <div className="reports-table-wrapper">
              <div className="orders-table-scroll">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Хэрэглэгч</th>
                      <th>Утас</th>
                      <th>Нийт дүн</th>
                      <th>Төлөв</th>
                      <th>Огноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 20).map((order) => (
                      <tr key={order.id}>
                        <td>{formatOrderCode(order.order_code)}</td>
                        <td>{order.customer_name || "-"}</td>
                        <td>{order.phone || "-"}</td>
                        <td>{Number(order.total_amount || 0).toLocaleString()}₮</td>
                        <td>{STATUS_LABELS[(order.status || "").toUpperCase()] || order.status}</td>
                        <td>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
