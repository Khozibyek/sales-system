import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetch("http://localhost:5050/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Алдаа гарлаа");
        }
        return response.json();
      })
      .then((data) => {
        setUsers(data.users || []);
        setError("");
      })
      .catch(() => {
        setError("Хэрэглэгчдийн мэдээлэл татахад алдаа гарлаа.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleDelete = (user) => {
    if (
      !window.confirm(
        `"${user.email}" хэрэглэгчийг устгах уу? `
      )
    ) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setDeletingId(user.id);
    fetch(`http://localhost:5050/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Устгал амжилтгүй");
        }
        return response.json();
      })
      .then(() => {
        setUsers((prev) => prev.filter((item) => item.id !== user.id));
        setError("");
      })
      .catch(() => {
        setError("Хэрэглэгч устгах явцад алдаа гарлаа.");
      })
      .finally(() => setDeletingId(null));
  };

  const handleToggleStatus = (user) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const nextActive = user.active ? 0 : 1;

    const message = user.active
      ? `"${user.email}" хэрэглэгчийн эрхийг идэвхгүй болгох уу?`
      : `"${user.email}" хэрэглэгчийн эрхийг идэвхжүүлэх үү?`;

    if (!window.confirm(message)) {
      return;
    }

    setTogglingId(user.id);

    fetch(`http://localhost:5050/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: nextActive }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Статус шинэчлэхэд алдаа гарлаа");
        }
        return response.json();
      })
      .then((data) => {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === user.id ? { ...item, active: data.active } : item
          )
        );
        setError("");
      })
      .catch(() => {
        setError("Статус шинэчлэхэд алдаа гарлаа.");
      })
      .finally(() => setTogglingId(null));
  };

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <h1>Хэрэглэгчдийн жагсаалт</h1>
        <button className="primary-btn" onClick={() => navigate("/admin/users/new")}>Хэрэглэгч нэмэх</button>
      </div>

      {loading ? (
        <p className="users-placeholder">Ачаалж байна...</p>
      ) : error ? (
        <p className="users-placeholder error">{error}</p>
      ) : users.length === 0 ? (
        <p className="users-placeholder">Хэрэглэгч олдсонгүй.</p>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Утас</th>
                <th>Бүртгэлийн өдөр</th>
                <th>Статус</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.phone ?? "-"}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "-"}</td>
                  <td>
                    <button
                      type="button"
                      className={`status-toggle ${user.active ? "status-active" : "status-inactive"}`}
                      onClick={() => handleToggleStatus(user)}
                      disabled={togglingId === user.id}
                    >
                      {togglingId === user.id
                        ? "Шинэчилж байна..."
                        : user.active
                        ? "Идэвхтэй"
                        : "Идэвхгүй"}
                    </button>
                  </td>
                  <td>
                    <div className="users-actions">
                      <button type="button" className="action-btn" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                        Засах
                      </button>
                      <button
                        type="button"
                        className="action-btn danger"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? "Устгаж байна..." : "Устгах"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
