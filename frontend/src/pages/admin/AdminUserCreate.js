import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const AdminUserCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setError("Нэр, имэйл, нууц үг талбаруудыг бөглөнө үү.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setSubmitting(true);
    setError("");

    fetch("/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data?.error || "Хэрэглэгч нэмэхэд алдаа гарлаа.");
          });
        }
        return response.json();
      })
      .then(() => {
        navigate("/admin/users");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <h1>Хэрэглэгч нэмэх</h1>
        <button className="ghost-btn" onClick={() => navigate(-1)} disabled={submitting}>
          Буцах
        </button>
      </div>

      <div className="users-form-wrapper">
        <form className="users-form" onSubmit={handleSubmit}>
          <label>
            <span>Нэр*</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ж. Бат"
            />
          </label>
          <label>
            <span>Имэйл*</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />
          </label>
          <label>
            <span>Утас</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="88881234"
            />
          </label>
          <label>
            <span>Нууц үг*</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="users-placeholder error">{error}</p> : null}

          <div className="users-actions">
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Хадгалж байна..." : "Хэрэглэгч нэмэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserCreate;
