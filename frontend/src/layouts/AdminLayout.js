import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import "../styles/admin/admin-layout.css";
import "../styles/admin/admin-products.css";
import "../styles/admin/admin-users.css";
import "../styles/admin/admin-orders.css";
import "../styles/admin/admin-order-detail.css";
import "../styles/admin/admin-product-modal.css";
import "../styles/admin/admin-reports.css";


const AdminLayout = () => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
