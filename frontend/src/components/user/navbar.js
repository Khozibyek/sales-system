import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/user/navbar.css";
import logo from "../../logo.png";

function NavbarUser() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const { id } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ✅ Нэвтэрсэн эсэх
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Категори ба нэвтрэлт шалгах
  useEffect(() => {
    axios
      .get("/api/products/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Category fetch error:", err));

    // ✅ Хэрэглэгч нэвтэрсэн эсэхийг шалгах
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!token && !!userId);

    const params = new URLSearchParams(location.search || "");
    const q = params.get("q");
    if (q) {
      setSearchTerm(q);
    }

    // dropdown гадна дарвал хаах
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Хадгалсан бараа руу
  const handleFavoritesClick = () => {
    if (!isLoggedIn) {
      navigate("/user/login");
    } else {
      navigate("/user/profile/favorites");
    }
  };

  // Сагс руу
  const handleCart = () => {
    if (!isLoggedIn) {
      navigate("/user/login");
    } else {
      navigate("/user/cart");
    }
  };

  // Профайл / Нэвтрэх товч
  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate("/user/login");
    } else {
      navigate("/user/profile");
    }
  };

  const ensureProductsLoaded = async () => {
    if (allProducts.length) return;
    setSearchLoading(true);
    try {
      const res = await axios.get("/api/products");
      setAllProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Product fetch for search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const filterResults = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    const q = term.toLowerCase();
    const filtered = allProducts
      .filter((p) => p.stock !== 0)
      .filter((p) => {
        const haystack = [
          p.name,
          p.model,
          p.brand,
          p.product_code,
          p.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
    setSearchResults(filtered);
  };

  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (!value.trim()) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    await ensureProductsLoaded();
    filterResults(value);
    setShowResults(true);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate("/user/home");
      return;
    }
    navigate(`/user/home?q=${encodeURIComponent(query)}`);
    filterResults(query);
    setShowResults(true);
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        {/* === Зүүн хэсэг === */}
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => navigate("/user/home")}>
            <img src={logo} alt="Logo" />
          </div>

          <div className="hamburger-wrap" ref={menuRef}>
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`}></i>
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <a onClick={() => navigate("/user/home")}>Нүүр</a>
                <a href="/about">Бидний тухай</a>
                <a href="/help">Тусламж</a>
                <a href="/contact">Холбоо барих</a>
              </div>
            )}
          </div>

          <form className="search-box" onSubmit={handleSearchSubmit} ref={searchRef}>
            <input
              type="text"
              placeholder="Хайлт хийх..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit">
              <i className="fas fa-search"></i>
            </button>
            {showResults && (
              <div className="search-results">
                {searchLoading ? (
                  <p className="search-result-placeholder">Ачаалж байна...</p>
                ) : searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="search-result-item"
                      onClick={() => {
                        setShowResults(false);
                        navigate(`/user/product/${item.id}`);
                      }}
                    >
                      <span className="search-result-name">{item.name}</span>
                      <span className="search-result-price">
                        {Number(item.price || 0).toLocaleString()}₮
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="search-result-placeholder">Үр дүн олдсонгүй</p>
                )}
              </div>
            )}
          </form>
        </div>

        {/* === Баруун хэсэг === */}
        <div className="navbar-right">
          <button onClick={handleFavoritesClick} title="Хадгалсан">
            <i className="fas fa-heart"></i>
          </button>

          <button onClick={handleCart} title="Сагс">
            <i className="fas fa-cart-shopping"></i>
          </button>

          {/* ✅ Нэвтрээгүй үед — Login icon / Нэвтэрсэн үед — Profile icon */}
          <button
            onClick={handleProfileClick}
            title={isLoggedIn ? "Профайл" : "Нэвтрэх"}
          >
            <i className={isLoggedIn ? "fas fa-user" : "fas fa-sign-in-alt"}></i>
          </button>
        </div>
      </div>

      {/* === Доод хэсэг === */}
      <div className="navbar-bottom">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/user/category/${cat.id}`)}
            className={`nav-category-btn ${id === String(cat.id) ? "active" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default NavbarUser;
