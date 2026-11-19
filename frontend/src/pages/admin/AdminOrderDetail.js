import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiPackage,
} from "react-icons/fi";

const ORDER_STATUSES = [
  { value: "PENDING", label: "Шинэ" },
  { value: "PROCESSING", label: "Боловсруулж байна" },
  { value: "COMPLETED", label: "Гүйцэтгэсэн" },
  { value: "CANCELLED", label: "Цуцлагдсан" },
];

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const formatOrderCode = (code) => {
    if (!code) return "-";
    const match = String(code).match(/(\d+)/);
    return match ? String(Number(match[1])) : code;
  };

  const parseResponse = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (err) {
      return { error: text };
    }
  };

  const fetchOrder = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5050/admin/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await parseResponse(res);
        if (!res.ok) {
          throw new Error(data?.error || "Захиалга татахад алдаа гарлаа.");
        }
        return data;
      })
      .then((data) => {
        setOrder(data.order || null);
        setError("");
      })
      .catch((err) => {
        setOrder(null);
        setError(err.message || "Захиалга татахад алдаа гарлаа.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = (status) => {
    if (!order) return;
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setUpdatingStatus(true);
    fetch(`http://localhost:5050/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then(async (res) => {
        const data = await parseResponse(res);
        if (!res.ok) {
          throw new Error(data?.error || "Төлөв шинэчлэхэд алдаа гарлаа.");
        }
        return data;
      })
      .then(() => {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        setError("");
      })
      .catch((err) => setError(err.message || "Төлөв шинэчлэхэд алдаа гарлаа."))
      .finally(() => setUpdatingStatus(false));
  };

  const itemsCount = useMemo(
    () => (order?.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [order?.items]
  );

  const totalAmount = useMemo(() => Number(order?.total_amount || 0), [order?.total_amount]);

  return (
    <div className="admin-order-detail-page">
      <div className="order-detail-header">
        <div className="header-left">
          <button className="ghost-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Буцах
          </button>
          {order ? (
            <div className="order-meta">
              <p className="order-code">Захиалга #{formatOrderCode(order.order_code)}</p>
              {order.created_at ? (
                <p className="order-date">
                  {new Date(order.created_at).toLocaleString("mn-MN")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="header-right">
          <div className="status-control">
            <span>Төлөв</span>
            <select
              value={(order?.status || "PENDING").toUpperCase()}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={updatingStatus || !order}
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <button className="ghost-btn" onClick={fetchOrder} aria-label="Дахин ачаалах">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="orders-placeholder">Захиалга ачаалж байна...</p>
      ) : error ? (
        <p className="orders-placeholder error">{error}</p>
      ) : !order ? (
        <p className="orders-placeholder">Захиалга олдсонгүй.</p>
      ) : (
        <>
          <div className="order-summary-grid">
            <div className="summary-card">
              <div className="summary-card-header">
                <FiUser />
                <span>Хэрэглэгчийн мэдээлэл</span>
              </div>
              <p className="summary-line">
                <strong>Нэр:</strong> {order.customer?.name || "Мэдээлэлгүй"}
              </p>
              <p className="summary-line">
                <strong>И-мэйл:</strong> {order.customer?.email || "Мэдээлэлгүй"}
              </p>
              <p className="summary-line">
                <strong>Утас:</strong> {order.customer?.phone || "Мэдээлэлгүй"}
              </p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <FiMapPin />
                <span>Хүргэлтийн хаяг</span>
              </div>
              <p className="summary-line">
                <strong>Хот/Аймаг:</strong> {order.address?.city || "Мэдээлэлгүй"}
              </p>
              <p className="summary-line">
                <strong>Дүүрэг/Сум:</strong> {order.address?.district || "Мэдээлэлгүй"}
              </p>
              <p className="summary-line">
                <strong>Хороо/Баг:</strong> {order.address?.subdistrict || "Мэдээлэлгүй"}
              </p>
              <p className="summary-line">
                <strong>Дэлгэрэнгүй:</strong> {order.address?.detail || "Тодорхойгүй"}
              </p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <FiCreditCard />
                <span>Төлбөрийн мэдээлэл</span>
              </div>
              <p className="summary-line">
                <strong>Төлбөрийн хэлбэр:</strong> {order.payment?.method || "Мэдээлэлгүй"}
              </p>
         
              <p className="summary-line">
                <strong>Нийт дүн:</strong> {totalAmount.toLocaleString()}₮
              </p>
            </div>
          </div>

          <div className="order-items-card">
            <div className="section-header">
              <div className="section-title">
                <FiPackage />
                <h3>Захиалсан бараа</h3>
                <span className="muted">({itemsCount} ширхэг)</span>
              </div>
            </div>

            {!order.items?.length ? (
              <p className="orders-placeholder">Бараа олдсонгүй.</p>
            ) : (
              <div className="orders-table-scroll">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Бараа</th>
                      <th>Үнэ</th>
                      <th>Тоо</th>
                      <th>Нийт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.item_id}>
                        <td>{item.item_id}</td>
                        <td className="product-cell">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <div className="image-placeholder">IMG</div>
                          )}
                          <div>
                            <p className="product-name">{item.name || "Нэргүй бүтээгдэхүүн"}</p>
                            <p className="product-sku">
                              ID: {item.product_id || "-"}
                            </p>
                          </div>
                        </td>
                        <td>{Number(item.price || 0).toLocaleString()}₮</td>
                        <td>{item.qty}</td>
                        <td>{Number((item.price || 0) * (item.qty || 0)).toLocaleString()}₮</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="order-totals">
              <div>
                <p className="muted">Нийт барааны тоо</p>
                <p className="total-value">{itemsCount} ширхэг</p>
              </div>
              <div>
                <p className="muted">Нийт төлбөр</p>
                <p className="total-value">{totalAmount.toLocaleString()}₮</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrderDetail;
