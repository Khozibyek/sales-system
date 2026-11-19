import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiRefreshCw, FiFilter, FiArrowUp, FiArrowDown } from "react-icons/fi";

const ORDER_STATUSES = [
  { value: "PENDING", label: "Шинэ", className: "badge-warning" },
  { value: "PROCESSING", label: "Боловсруулж байна", className: "badge-info" },
  { value: "COMPLETED", label: "Гүйцэтгэсэн", className: "badge-success" },
  { value: "CANCELLED", label: "Цуцлагдсан", className: "badge-danger" },
];


const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const formatOrderCode = (code) => {
    if (!code) return "-";
    const match = String(code).match(/(\d+)/);
    return match ? String(Number(match[1])) : code;
  };

  const parseResponse = async (response) => {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      return { error: text };
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setLoading(true);
    fetch("/admin/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await parseResponse(res);
          throw new Error(data?.error || "Захиалгуудыг татахад алдаа гарлаа.");
        }
        return parseResponse(res);
      })
      .then((data) => {
        const normalized = (Array.isArray(data.orders) ? data.orders : []).map((order) => ({
          ...order,
          status: (order.status || "PENDING").toUpperCase(),
        }));
        setOrders(normalized);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Захиалга татахад алдаа гарлаа.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          !search ||
          order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          order.order_code?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          !statusFilter || (order.status || "").toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (sortDir === "asc") {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [orders, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleStatusUpdate = (orderId, status) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setUpdatingStatusId(orderId);
    fetch(`/admin/orders/${orderId}/status`, {
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
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status } : order
          )
        );
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setUpdatingStatusId(null));
  };

  return (
    <div className="admin-orders-page">
      <div className="orders-header">
        <div>
          <h1>Захиалгууд</h1>
          <p>Бүх захиалгын төлөв, төлбөр, хүргэлтийн мэдээллийг хянах</p>
        </div>
        <div className="orders-header-actions">
          <button className="ghost-btn" onClick={() => navigate(-1)}>
            Буцах
          </button>
          <button className="ghost-btn" onClick={() => window.location.reload()}>
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="orders-filters">
        <div className="filter-group">
          <FiSearch />
          <input
            type="search"
            placeholder="Захиалгын код эсвэл хэрэглэгчээр хайх..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="filter-group">
          <FiFilter />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Бүх төлөв</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="orders-table-wrapper">
        {loading ? (
          <p className="orders-placeholder">Захиалгуудыг ачаалж байна...</p>
        ) : error ? (
          <p className="orders-placeholder error">{error}</p>
        ) : !filteredOrders.length ? (
          <p className="orders-placeholder">Захиалга олдсонгүй.</p>
        ) : (
          <div className="orders-table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("order_code")}>
                    №{" "}
                    {sortKey === "order_code" ? sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown /> : null}
                  </th>
                  <th>Хэрэглэгч</th>
                  <th>Утсан дугаар</th>
                  <th>Нийт дүн</th>
                  <th>Төлбөр</th>
                  <th>Төлөв</th>
                  <th onClick={() => toggleSort("created_at")}>
                    Огноо{" "}
                    {sortKey === "created_at" ? sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown /> : null}
                  </th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order.id}>
                      <td>{formatOrderCode(order.order_code)}</td>
                      <td>{order.customer_name || "Нэргүй"}</td>
                      <td>{order.phone || "Мэдээлэлгүй"}</td>
                      <td>{Number(order.total_amount || 0).toLocaleString()}₮</td>
                      <td>{order.payment_method || "Утгагүй"}</td>
                      <td>
                        <select
                          className="status-select"
                          value={(order.status || "PENDING").toUpperCase()}
                          onChange={(event) =>
                            handleStatusUpdate(order.id, event.target.value)
                          }
                          disabled={updatingStatusId === order.id}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</td>
                      <td>
                        <button className="ghost-btn" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                          Дэлгэрэнгүй
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
