import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { path: "/admin/dashboard", icon: "⌂", label: "Хянах самбар" },
  { path: "/admin/products", icon: "▣", label: "Бараа бүтээгдэхүүн" },
  { path: "/admin/orders", icon: "▤", label: "Захиалгууд" },
  { path: "/admin/users", icon: "♙", label: "Хэрэглэгчид" },
];

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>ADMIN</h2>
        <span>Удирдлагын хэсэг</span>
      </div>

      <nav className="admin-sidebar-nav">
        <p className="admin-sidebar-label">ҮНДСЭН ЦЭС</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin/products"}
            className={({ isActive }) =>
              `admin-sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="admin-sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <span>Admin Panel</span>
        <small>Удирдлагын систем</small>
      </div>
    </aside>
  );
};

export default AdminSidebar;
