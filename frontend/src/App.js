
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// User layout
import UserLayout from "./layouts/UserLayout";

// User pages
import Home from "./pages/user/home";
import Login from "./pages/user/login";
import Register from "./pages/user/register";
import CategoryPage from "./pages/user/category";
import ProductDetail from "./pages/user/ProductDetail";
import CartPage from "./pages/user/CartPage";

// Profile pages
import ProfileLayout from "./pages/user/profile/ProfileLayout";
import Info from "./pages/user/profile/Info";
import Orders from "./pages/user/profile/Orders";
import Favorites from "./pages/user/profile/Favorites";
import ProfileIndex from "./pages/user/profile/index";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminReports from "./pages/admin/AdminReports";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductCreate from "./pages/admin/AdminProductCreate";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserCreate from "./pages/admin/AdminUserCreate";
import AdminUserEdit from "./pages/admin/AdminUserEdit";

// Other
import NotFound from "./pages/NotFound";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";

function App() {
  return (
    <BrowserRouter>
      <BreadcrumbProvider>
        <Routes>
          {/* Home redirect */}
          <Route path="/" element={<Navigate to="/user/home" replace />} />

          {/* User pages */}
          <Route
            path="/user/login"
            element={<UserLayout><Login /></UserLayout>}
          />
          <Route
            path="/user/register"
            element={<UserLayout><Register /></UserLayout>}
          />
          <Route
            path="/user/home"
            element={<UserLayout><Home /></UserLayout>}
          />
          <Route
            path="/user/cart"
            element={<UserLayout><CartPage /></UserLayout>}
          />
          <Route
            path="/user/category/:id"
            element={<UserLayout><CategoryPage /></UserLayout>}
          />
          <Route
            path="/user/category/:id/brand/:brandName"
            element={<UserLayout><CategoryPage /></UserLayout>}
          />
          <Route
            path="/user/product/:id"
            element={<UserLayout><ProductDetail /></UserLayout>}
          />

          {/* Profile pages */}
          <Route path="/user/profile" element={<ProfileLayout />}>
            <Route index element={<ProfileIndex />} />
            <Route path="info" element={<Info />} />
            <Route path="orders" element={<Orders />} />
            <Route path="favorites" element={<Favorites />} />
          </Route>

          {/* Admin pages */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminReports />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductCreate />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />

          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />

          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/new" element={<AdminUserCreate />} />
          <Route path="/admin/users/:id/edit" element={<AdminUserEdit />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BreadcrumbProvider>
    </BrowserRouter>
  );
}

export default App;

