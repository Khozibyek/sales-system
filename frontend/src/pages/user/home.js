import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/user/home.css";

function Home() {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios
      .get("/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const q = params.get("q") || "";
    setSearchTerm(q);
  }, [location.search]);

  // 🧩 Фильтер: зөвхөн бараа байгаа үед л харуулах
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (p.stock === 0) return false; // ⛔ Дууссан барааг алгасах

      if (activeTab === "discount" && !(p.discount_percent > 0)) return false;
      if (activeTab === "featured" && !(p.is_featured === 1)) return false;
      if (activeTab === "new" && !(p.days_since_added <= 14)) return false;

      if (term) {
        const haystack = [
          p.name,
          p.model,
          p.brand,
          p.description,
          p.product_code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [products, activeTab, searchTerm]);

  // 🏷️ Badge renderer
  const renderTagBadges = (p, activeTab) => {
    const badges = [];

    // --- Шинэ ---
    if (activeTab === "new") {
      badges.push(<span key="new" className="home-badge new">Шинэ</span>);
      if (p.discount_percent > 0)
        badges.push(<span key="discount" className="home-badge discount">-{p.discount_percent}%</span>);
      if (p.is_featured)
        badges.push(<span key="featured" className="home-badge featured">Онцлох</span>);
    }

    // --- Хямдралтай ---
    else if (activeTab === "discount") {
      badges.push(<span key="discount" className="home-badge discount">-{p.discount_percent}%</span>);
      if (p.days_since_added <= 2)
        badges.push(<span key="new" className="home-badge new">Шинэ</span>);
      if (p.is_featured)
        badges.push(<span key="featured" className="home-badge featured">Онцлох</span>);
    }

    // --- Онцлох ---
    else if (activeTab === "featured") {
      badges.push(<span key="featured" className="home-badge featured">Онцлох</span>);
      if (p.days_since_added <= 2)
        badges.push(<span key="new" className="home-badge new">Шинэ</span>);
      if (p.discount_percent > 0)
        badges.push(<span key="discount" className="home-badge discount">-{p.discount_percent}%</span>);
    }

    return badges;
  };

  return (
    <div className="home-page">
      {/* Banner — хэвээр */}
      <div className="banner">
        <img
          src="/uploads/banner.png"
          alt="Main Banner"
        />
      </div>

      {/* Tabs — хэвээр */}
      <div className="product-tabs">
        <button
          className={activeTab === "new" ? "active" : ""}
          onClick={() => setActiveTab("new")}
        >
          Шинэ
        </button>
        <button
          className={activeTab === "discount" ? "active" : ""}
          onClick={() => setActiveTab("discount")}
        >
          Хямдралтай
        </button>
        <button
          className={activeTab === "featured" ? "active" : ""}
          onClick={() => setActiveTab("featured")}
        >
          Онцлох
        </button>
      </div>

      {/* Барааны жагсаалт */}
      <div className="home-product-list">
        {filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div
              className="home-product-card"
              key={p.id}
              onClick={() => navigate(`/user/product/${p.id}`)}
            >
              <div className="home-product-image">
                <img
                  src={
                    p.main_image
                      ? `/${p.main_image}`
                      : "/no-image.jpg"
                  }
                  alt={p.name}
                />
              </div>

              <div className="home-product-info">
                <div className="home-product-header">
                  <h3 className="home-model">{p.model}</h3>
                  <div className="home-badges">
                    {renderTagBadges(p, activeTab)}
                  </div>
                </div>

                <h2 className="home-product-name">{p.name}</h2>

                {p.discount_percent > 0 ? (
                  <div className="home-price-box">
                    <p className="home-discounted-price">
                      {Number(
                        p.price * (1 - p.discount_percent / 100)
                      ).toLocaleString()}{" "}
                      ₮
                    </p>
                    <p className="home-original-price">
                      {Number(p.price).toLocaleString()} ₮
                    </p>
                  </div>
                ) : (
                  <p className="home-normal-price">
                    {Number(p.price).toLocaleString()} ₮
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">Бараа байхгүй байна</p>
        )}
      </div>
    </div>
  );
}

export default Home;
