import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/user/Sidebar";
import { BreadcrumbContext } from "../../context/BreadcrumbContext";
import { toast } from "react-toastify";
import "../../styles/user/sidebar.css";

export default function CategoryPage() {
  const { id, brandName } = useParams();
  const navigate = useNavigate();
  const [favoriteMap, setFavoriteMap] = useState({}); // { product_id: true/false }

  const context = useContext(BreadcrumbContext);
  const setSelectedModel = context?.setSelectedModel || (() => { });

  const [categoryName, setCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModelLocal] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isAdded, setIsAdded] = useState(false);

  const userId = localStorage.getItem("userId");

  //  Дуртай бараа хадгалах / хасах
  const handleFavorite = async (e, productId) => {
    e.stopPropagation();

    if (!userId) {
      toast.warning("Нэвтэрсний дараа дуртай бараанд нэмэх боломжтой");
      return;
    }

    try {
      const res = await axios.post("/api/favorites/toggle", {
        user_id: userId,
        product_id: productId,
      });

      const favorited = res.data.favorited;
      setFavoriteMap((prev) => ({
        ...prev,
        [productId]: favorited,
      }));

      favorited
        ? toast.success("Дуртай жагсаалтад нэмэгдлээ")
        : toast.info("Дуртай жагсаалтаас хасагдлаа ");
    } catch (err) {
      console.error("Favorite toggle error:", err);
      toast.error("Хадгалах үед алдаа гарлаа");
    }
  };

  // Дуртай бараануудыг ачаалах (улаан зүрх идэвхжүүлэх)
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/favorites/user/${userId}`)
      .then((res) => {
        const favs = {};
        res.data.forEach((item) => {
          favs[item.id] = true;
        });
        setFavoriteMap(favs);
      })
      .catch((err) => console.error("Favorites fetch error:", err));
  }, [userId]);

  // 🛒 Сагсны өгөгдөл татах
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/cart/${userId}`)
      .then((res) => setCartItems(res.data))
      .catch((err) => console.error("Cart fetch error:", err));
  }, [userId]);

  // 📦 Ангиллын бараанууд татах
  useEffect(() => {
    axios
      .get(`/api/products/category/${id}`)
      .then((res) => {
        const data = res.data.products;
        setCategoryName(res.data.category);
        setBrands([...new Set(data.map((p) => p.brand))]);

        if (brandName) {
          const models = [
            ...new Set(data.filter((p) => p.brand === brandName).map((p) => p.model)),
          ];
          setModels(models);

          const filtered = data.filter(
            (p) =>
              p.brand?.toLowerCase() === brandName.toLowerCase() &&
              (!selectedModel || p.model === selectedModel)
          );
          setProducts(filtered);
        } else {
          setProducts(data);
          setModels([]);
        }
      })
      .catch((err) => console.error("Error loading category:", err));
  }, [id, brandName, selectedModel]);

  const handleModelClick = (m) => {
    setSelectedModelLocal(m);
    setSelectedModel(m);
  };

  const handleBrandClick = (b, resetModel = false) => {
    if (resetModel) {
      setSelectedModelLocal(null);
      setSelectedModel(null);
      return;
    }
    navigate(`/user/category/${id}/brand/${encodeURIComponent(b)}`);
  };

  // Сагсанд нэмэх
  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.warning("Сагсанд нэмэхийн тулд нэвтэрч орно уу!");
      return;
    }

      if (product.stock <= 0) {
    toast.warning("Энэ бараа дууссан байна!");
    return;
  }

    try {
      await axios.post("/api/cart/add", {
        user_id: userId,
        product_id: product.id,
        quantity: 1,
      });

      setCartItems((prev) => [
        ...prev,
        { product_id: product.id, quantity: 1, name: product.name },
      ]);

      toast.success("Сагсанд нэмэгдлээ!", { autoClose: 1500 });

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    } catch (err) {
      console.error("Cart add error:", err);
      toast.error("Сагсанд нэмэх үед алдаа гарлаа");
    }
  };

  useEffect(() => {
    setSelectedModelLocal(null);
    setSelectedModel(null);
  }, [brandName]);

  return (
    <div className="category-page">
      <div className="category-layout">
        <Sidebar categoryName={categoryName} brands={brands} onBrandClick={handleBrandClick} />

        <div className="category-content">
          <h2 className="category-title">
            {brandName ? brandName : "Бүгд"}{" "}
            <span style={{ color: "#4f46e5", fontSize: "16px" }}> | </span>
            <span className="product-count">{products.length} бүтээгдэхүүн</span>
          </h2>

          {/* ✅ Моделийн шүүлтүүр */}
          {models.length > 0 && (
            <div className="model-filter">
              {models.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleModelClick(m)}
                  className={`model-btn ${selectedModel === m ? "active" : ""}`}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={() => handleModelClick(null)}
                className={`model-btn ${!selectedModel ? "active" : ""}`}
              >
                Бүгд
              </button>
            </div>
          )}

          {/* Бүтээгдэхүүн жагсаалт */}
          <div className="category-product-grid">
            {products.map((p) => {
              const isInCart = cartItems.some((item) => item.product_id === p.id);
              const isFav = favoriteMap[p.id] || false;

              const badges = [];
              if (p.stock === 0) {
                badges.push(<span key="out-of-stock" className="badge out-of-stock">Дууссан</span>);
              } else {
                if (p.days_since_added <= 14)
                  badges.push(<span key="new" className="badge new">Шинэ</span>);
                if (p.discount_percent > 0)
                  badges.push(<span key="discount" className="badge discount">-{p.discount_percent}%</span>);
                if (p.is_featured)
                  badges.push(<span key="featured" className="badge featured">Онцлох</span>);
              }
              return (
                <div className="category-product-card" key={p.id}>
                  <div className="category-product-image-wrapper">
                    <div className="badge-container">{badges}</div>
                    <img
                      src={`/${p.main_image}`}
                      alt={p.name}
                      className="category-product-image"
                      onClick={() => navigate(`/user/product/${p.id}`)}
                    />
                    {/*  Дуртай товч */}
                    <button
                      className="category-favorite-btn"
                      onClick={(e) => handleFavorite(e, p.id)}
                    >
                      <i className={isFav ? "fas fa-heart" : "far fa-heart"}></i>
                    </button>
                  </div>
                  {/*  Мэдээлэл хэсэг */}
                  <div className="product-details">
                    <h5 className="product-brand">{p.brand}</h5>
                    <h3
                      className="product-name"
                      onClick={() => navigate(`/user/product/${p.id}`)}
                    >
                      {p.name}
                    </h3>
                    <div className="category-price-box">
                      <div>
                        {p.discount_percent > 0 ? (
                          <>
                            <p className="category-discounted-price">
                              {Number(p.discounted_price).toLocaleString()} ₮
                            </p>
                            <p className="category-original-price">
                              {Number(p.price).toLocaleString()} ₮
                            </p>
                          </>
                        ) : (
                          <p className="category-normal-price">
                            {Number(p.price).toLocaleString()} ₮
                          </p>
                        )}
                      </div>
                      {/* 🛒 Сагсанд нэмэх товч */}
                      <button
                        className={`category-add-cart-btn ${p.stock === 0 || isInCart ? "disabled" : ""}`}
                        // disabled={p.stock === 0 || isInCart}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isInCart) handleAddToCart(p);
                        }}
                      >
                        <i className={`fas ${isInCart ? "fa-check" : "fa-plus"}`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
