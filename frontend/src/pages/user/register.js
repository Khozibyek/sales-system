import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// regist
const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

   useEffect(() => {
    const navType = performance.getEntriesByType("navigation")[0]?.type;
    if (navType === "reload") {
      navigate("/user/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const res = await axios.post("http://localhost:5050/user/register", form);
      toast.success(res.data.message || "Амжилттай бүртгүүллээ!");
      navigate("/user/login");
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        // тодорхой талбартай алдаа
        setErrors({ [data.field]: data.error });
      } else {
        // ерөнхий алдаа
        setErrors({ general: data?.error || "Алдаа гарлаа!" });
      }
    }
  };



  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Бүртгүүлэх</h2>

        <form onSubmit={handleSubmit}>
          <label>Хэрэглэгчийн нэр</label>
          <input
            type="text"
            name="name"
            placeholder="Нэрээ оруулна уу"
            value={form.name}
            onChange={handleChange}

          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <label>И-мэйл хаяг</label>
          <input
            type="email"
            name="email"
            placeholder="И-мэйл хаяг оруулна уу"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <label>Утасны дугаар</label>
          <input
            type="text"
            name="phone"
            placeholder="Утасны дугаар оруулна уу"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <p className="error-text">{errors.phone}</p>}

          <label>Нууц үг</label>
          <input
            type="password"
            name="password"
            placeholder="Нууц үгээ оруулна уу"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}

          <label>Нууц үг баталгаажуулах</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Нууц үгээ дахин оруулна уу"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="error-text">{errors.confirmPassword}</p>
          )}

          {success && (
            <p
              style={{
                color: "green",
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {success}
            </p>
          )}
          {errors.general && (
            <p className="error-text" style={{ textAlign: "center" }}>
              {errors.general}
            </p>
          )}

          <button type="submit" className="register-btn">
            Бүртгүүлэх
          </button>
        </form>

        <p className="login-link">
          Та бүртгэлтэй юу? <a href="/user/login">Нэвтрэх</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
