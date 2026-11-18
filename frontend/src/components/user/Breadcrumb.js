import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BreadcrumbContext } from "../../context/BreadcrumbContext";
import "../../styles/user/navbar.css";

const Breadcrumb = () => {
  const navigate = useNavigate();
  const context = useContext(BreadcrumbContext);
  const location = useLocation();
  const [categoryName, setCategoryName] = useState("");
  const [brandName, setBrandName] = useState("");
  const { selectedCategory, selectedBrand, selectedModel, productName } = context;

  const isHomePage = location.pathname === "/user/home";
  


  const pathnames = location.pathname.split("/").filter(Boolean);

  const categoryIdx = pathnames.indexOf("category");
  const brandIdx = pathnames.indexOf("brand");
  const categoryId = categoryIdx !== -1 ? pathnames[categoryIdx + 1] : null;
  const brand =
    brandIdx !== -1 ? decodeURIComponent(pathnames[brandIdx + 1] || "") : "";


  // API fetch
  useEffect(() => {
    if (!categoryId) return;
    axios
      .get(`http://localhost:5050/api/products/category/${categoryId}`)
      .then((res) => setCategoryName(res.data.category))
      .catch(() => setCategoryName(""));
  }, [categoryId]);

  useEffect(() => {
    setBrandName(brand);
  }, [brand]);


  // 🧩 Хэрвээ context байхгүй (жишээ нь login/register) бол юу ч харуулахгүй
  if (!context) return null;

  //  Breadcrumb угсралт
  const crumbs = [{ label: "Нүүр", to: "/user/home" }];

  if (categoryId) {
    crumbs.push({
      label: categoryName,
      to: `/user/category/${categoryId}`,
    });
  }
  if (selectedCategory) {
    crumbs.push({
      label: selectedCategory,
      to: `/user/category/${categoryId})}`,
    });
  }

  if (brandName) {
    crumbs.push({
      label: brandName,
      to: `/user/category/${categoryId}/brand/${encodeURIComponent(brandName)}`,
    });
  }
  if (selectedBrand) {
    crumbs.push({
      label: selectedBrand,
      to: `/user/category/${categoryId}/brand/${encodeURIComponent(selectedBrand)}`,
    });
  }
  if (selectedModel) {
    crumbs.push({ label: selectedModel });
  }

  if (productName) {
    crumbs.push({ label: productName });
  }



  return (
    <nav className="breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i}>
            {i !== 0 && <span className="separator"> / </span>}
            {/* {c.to && !isLast ? (
              <Link to={c.to}>{c.label}</Link>
            ) : (
              <span className="active">{c.label}</span>
            )} */}

            {c.to && !isLast ? (
              <span className="breadcrumb-link disabled">{c.label}</span>
            ) : (
              <span className="active">{c.label}</span>
            )}

          </span>
        );
      })}
      {/* 🔙 Буцах товч */}
{!isHomePage && (
  <button
    className="breadcrumb-back-btn"
    onClick={() => navigate(-1)}
    title="Өмнөх хуудас руу буцах"
  >
    <i className="fa-solid fa-angle-left"></i>
    
  </button>
)}
    </nav>
    
    
  );
};

export default Breadcrumb;
