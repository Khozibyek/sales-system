import React, { useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import NavbarUser from "../components/user/navbar";
import Breadcrumb from "../components/user/Breadcrumb";
import Footer from "../components/user/footer";
import { BreadcrumbProvider, BreadcrumbContext } from "../context/BreadcrumbContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/user/navbar.css";


export default function UserLayout({ children }) {
  return (
    <BreadcrumbProvider>
      <LayoutInner>{children}</LayoutInner>
    </BreadcrumbProvider>
  );
}

function LayoutInner({ children }) {
  const location = useLocation();
  const { setSelectedModel } = useContext(BreadcrumbContext);

  useEffect(() => {
    // 🧹 Route солигдох бүрт model context цэвэрлэнэ
    setSelectedModel(null);
  }, [location.pathname]);

  return (
    <>
      <NavbarUser />
      <Breadcrumb />
      <main
        style={{
          marginTop: "100px",
          padding: "20px 40px",
          minHeight: "calc(100vh - 100px)",
          backgroundColor: "#f9f9f9",
        }}
      >
        {children}

        {/*  Toast container бүх хуудсанд мессеж харуулах */}
        <ToastContainer
          position="top-right"
          autoClose={1500}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />

      </main>
      <Footer />
    </>
  );
}