import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/login.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("И-мэйл болон нууц үгээ бөглөнө үү.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post("/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(response.data.admin));

      navigate("/admin/dashboard");
    } catch (err) {
      const message = err.response?.data?.error || "Нэвтрэхэд алдаа гарлаа.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="login-badge">ADMIN</div>
          <h1>Админ хандалт</h1>
          <p>Удирдлагын самбарыг ашиглахын тулд эрхээрээ нэвтэрнэ үү.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>И-мэйл</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@sales.mn"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Нууц үг</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? "Нэвтрэх..." : "Нэвтрэх"}
          </button>
        </form>

        <footer className="login-footer">
          <button type="button" onClick={() => navigate("/user/home")}>
            Дэлгүүр рүү буцах
          </button>
          <button type="button" onClick={() => navigate("/admin/forgot-password")}>
            Нууц үг сэргээх
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminLogin;
