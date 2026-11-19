import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const pageTitles = {
  "/admin/dashboard": "Хянах самбар",
  "/admin/reports": "Тайлан",
  "/admin/products": "Бараа бүтээгдэхүүн",
  "/admin/products/new": "Шинэ бараа нэмэх",
  "/admin/orders": "Захиалгууд",
  "/admin/users": "Хэрэглэгчид",
  "/admin/users/new": "Шинэ хэрэглэгч нэмэх",
};

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;

    if (pageTitles[path]) return pageTitles[path];
    if (path.includes("/products/") && path.endsWith("/edit")) {
      return "Бараа засах";
    }
    if (path.includes("/orders/")) return "Захиалгын дэлгэрэнгүй";
    if (path.includes("/users/") && path.endsWith("/edit")) {
      return "Хэрэглэгч засах";
    }

    return "Удирдлагын хэсэг";
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <h1>{getTitle()}</h1>
        <p>Удирдлагын самбар</p>
      </div>

      <button className="admin-logout-btn" onClick={handleLogout}>
        Гарах
      </button>
    </header>
  );
};

export default AdminHeader;
