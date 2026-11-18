import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/user/login.css";


function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // input өөрчлөгдөхөд state шинэчлэх
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); 
  };

  // form илгээх үед ажиллана
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const res = await axios.post("http://localhost:5050/user/login", form);

      // Token хадгалах
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userId", res.data.user.id); 

      navigate("/user/profile");
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors({ [data.field]: data.error });
      } else {
        setErrors({ general: data?.error || "Алдаа гарлаа!" });
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Нэвтрэх</h2>

        <form onSubmit={handleSubmit}>
          <label>Нэвтрэх хаяг</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="И-мэйл хаяг оруулна уу"
            required
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <label>Нууц үг</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Нууц үг оруулна уу"
            required
          />
          {errors.password && <p className="error-text">{errors.password}</p>}

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />
              <p>Сануулах</p>
            </label>
            <a href="/about" className="forgot-password">Нууц үг мартсан</a>
          </div>

          {errors.general && (
            <p className="error-text" style={{ textAlign: "center" }}>
              {errors.general}
            </p>
          )}

          <button type="submit" className="login-btn">Нэвтрэх</button>
        </form>

        <p className="signup-text">
          Шинэ хэрэглэгч болох <a href="/user/register">Бүртгүүлэх</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
