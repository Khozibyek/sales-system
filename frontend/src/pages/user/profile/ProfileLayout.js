import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaLock,
  FaClipboardList,
  FaHeart,
  FaSignOutAlt,
} from "react-icons/fa";
import "../../../styles/user/profile.css";

// 🧭 Navbar ба Footer импорт
import NavbarUser from "../../../components/user/navbar";
import Footer from "../../../components/user/footer";
import Breadcrumb from "../../../components/user/Breadcrumb";

export default function ProfileLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/user/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/user/login");
  };

  return (
    <>
      {/* ✅ Header / Navbar */}
      <NavbarUser />
      <Breadcrumb />

      <div className="profile-layout">
        {/* Зүүн талын sidebar */}
        <div className="profile-sidebar">
          <div className="user-header">
            <FaUserCircle className="sidebar-icon" />
            <div className="user-info">
              <h3>{user?.name || "Хэрэглэгчийн нэр"}</h3>
              <p className="email">{user?.email || "email@example.com"}</p>
            </div>
          </div>

          {/* Меню */}
          <ul className="sidebar-menu">
            <li>
              <NavLink
                to="/user/profile/info"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <FaLock /> Хувийн мэдээлэл
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/profile/orders"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <FaClipboardList /> Миний захиалгууд
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user/profile/favorites"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <FaHeart /> Хадгалсан бараа
              </NavLink>
            </li>
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Гарах
          </button>
        </div>

        {/* Баруун талын контент */}
        <div className="profile-content">
          <Outlet />
        </div>
      </div>

      {/* ✅ Footer */}
      <Footer />
    </>
  );
}
