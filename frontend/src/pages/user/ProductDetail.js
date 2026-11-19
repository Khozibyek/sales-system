import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BreadcrumbContext } from "../../context/BreadcrumbContext";
import { toast } from "react-toastify";
import "../../styles/user/product.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const { setSelectedCategory, setProductName, setSelectedModel, setSelectedBrand } = useContext(BreadcrumbContext);

  const userId = localStorage.getItem("userId");
  const [favoriteMap, setFavoriteMap] = useState({});
  const handleBuyNow = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.warning("Худалдан авахын тулд нэвтэрч орно уу!");
      navigate("/user/login");
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
        quantity,
      });

      navigate("/user/cart");
    } catch (err) {
      console.error("Buy Now error:", err);
      toast.error("Худалдан авах үед алдаа гарлаа.");
    }
  };

  const handleFavorite = async (e, productId) => {
    e.stopPropagation();

    if (!userId) {
      toast.warning("Нэвтэрсний дараа дуртай бараанд нэмэх боломжтой");
      navigate("/user/login");
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
        ? toast.success("Дуртай жагсаалтад нэмэгдлээ ")
        : toast.info("Дуртай жагсаалтаас хасагдлаа ");
    } catch (err) {
      console.error("Favorite toggle error:", err);
      toast.error("Хадгалах үед алдаа гарлаа");
    }
  };

  // 🧠 Дуртай бараа ачаалах
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

  const handleAddToCart = async () => {
    const userId = localStorage.getItem("userId");
      if (!userId) {
          toast.warning("Сагсанд нэмэхийн тулд нэвтэрч орно уу!");
          return;
        }

    if (product.stock <= 0) {
      toast.warning("Энэ бараа дууссан байна!");
      return;
    }

    try {
      //  Сагсанд тухайн бараа байгаа эсэхийг шалгах
      const check = await axios.get(`/api/cart/${userId}`);
      const exists = check.data.some((item) => item.product_id === product.id);

      if (exists) {
        toast.info("Сагсанд нэмэгдсэн байна!");
        return; // — дахин нэмэхгүй
      }

      //  Хэрвээ байхгүй бол шинээр нэмэх
      await axios.post("/api/cart/add", {
        user_id: userId,
        product_id: product.id,
        quantity,
      });

      toast.success("Бараа сагсанд нэмэгдлээ!");
    } catch (err) {
      console.error("Cart add error:", err);
      toast.error("Сагсанд нэмэхэд алдаа гарлаа.");
    }
  };


  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/products/${id}`)
      .then((res) => {
        const productData = res.data;
        setProduct(productData);
        setProductName(productData.name);
        setSelectedModel(productData.model);
        setSelectedBrand(productData.brand);
        setSelectedCategory(productData.category);
      })
      .catch((err) => console.error("Product fetch error:", err));

    // 🧹 Хуудаснаас гарахад context цэвэрлэнэ
    return () => {
      setProductName(null);
      setSelectedModel(null);
      setSelectedBrand(null);
      setSelectedCategory(null);
    };
  }, [id, setProductName, setSelectedModel, setSelectedBrand, setSelectedCategory]);

  if (!product) return <p>Бараа ачаалж байна...</p>;

  const discount = product.discount_percent || 0;
  const hasDiscount = discount > 0;
  const isOutOfStock = product.stock <= 0;


  return (
    <div className="product-detail-container">
      {/* === ДЭЭД ХЭСЭГ === */}
      <div className="product-header-top">
        <div className="product-title-line wide">
          <h1 className="product-title-top">{product.name}</h1>
          <span className="product-brand-badge float-right">{product.brand}</span>
        </div>
        <p className="product-code-top">Барааны код: #{product.product_code}</p>
      </div>

      <div className="product-detail">
        {/* === ЗҮҮН ХЭСЭГ === */}
        <div className="product-left">
          <div className="product-gallery">
            {/* --- Thumbnail жагсаалт --- */}
            <div className="thumbnail-list">
              {Array.isArray(product.images) && product.images.length > 0
                ? product.images.map(
                  (img, i) =>
                    img &&
                    img.trim() !== "" && (
                      <img
                        key={i}
                        src={`/${img}`}
                        onClick={() => setSelectedImage(img)}
                        className={selectedImage === img ? "active" : ""}
                        alt={`${product.name} ${i + 1}`}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    )
                )
                : product.image &&
                product.image.trim() !== "" && (
                  <img
                    src={`/${product.image}`}
                    onClick={() => setSelectedImage(product.image)}
                    alt={product.name}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
            </div>

            {/* --- Main зураг --- */}
            <div className="main-image">
              <img
                src={`/${selectedImage || product.images?.[0]
                  }`}
                alt={product.name}
              />
            </div>
          </div>

          <div className="product-specs">
            <h3>Бүтээгдэхүүний үзүүлэлт</h3>
            {product.specs && product.specs.length > 0 ? (
              <ul>
                {product.specs.map((s, i) => (
                  <li key={i}>
                    <strong>{s.field_name}:</strong> {s.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Үзүүлэлтийн мэдээлэл байхгүй</p>
            )}
          </div>
        </div>

        {/* === БАРУУН ХЭСЭГ === */}
        <div className="product-info">
          <button
            className={`save-btnn ${favoriteMap[id] ? "active" : ""}`}
            onClick={(e) => handleFavorite(e, id)}
            title={favoriteMap[id] ? "Хадгалсан" : "Хадгалах"}
          >
            <i className={favoriteMap[id] ? "fas fa-heart" : "far fa-heart"}></i>
          </button>


          {/* 💰 Үнэ хэсэг */}
          {isOutOfStock ? (
            <div className="price-pair-box">
              <span className="price-label">Үнэ</span>
              <div className="discounted-price">
                {Number(product.price).toLocaleString()} ₮
              </div>
            </div>
          ) : hasDiscount ? (
            <div className="price-pair-box">
              <div className="price-label-row">
                <span className="price-label">Хямдралтай үнэ</span>
                <span className="price-label right">Үндсэн үнэ</span>
              </div>

              <div className="price-value-row">
                <div className="discounted-price">
                  {Number(
                    product.discounted_price ??
                    product.price * (1 - discount / 100)
                  ).toLocaleString()}{" "}
                  ₮
                  <span className="discount-percent-badge">-{discount}%</span>
                </div>

                <div className="original-price">
                  {Number(product.price).toLocaleString()} ₮
                </div>
              </div>

              <p className="saving-line">
                Хэмнэлт:{" "}
                <span>
                  {Number(
                    product.price -
                    (product.discounted_price ??
                      product.price * (1 - discount / 100))
                  ).toLocaleString()}{" "}
                  ₮
                </span>
              </p>
            </div>
          ) : (
            <div className="price-pair-box">
              <span className="price-label">Үнэ</span>
              <div className="discounted-price">
                {Number(product.price).toLocaleString()} ₮
              </div>
            </div>
          )}

          {/* 🔢 Тоо ширхэг эсвэл Дууссан badge */}
          {isOutOfStock ? (
            <div className="out-of-stock-badge">Дууссан</div>
          ) : (
            <div className="quantity-section">
              <div className="quantity-box">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
                >
                  −
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() =>
                    setQuantity((prev) =>
                      prev < product.stock ? prev + 1 : prev
                    )
                  }
                >
                  ＋
                </button>
              </div>
              <p className="stock-text">
                Үлдэгдэл: <span>{product.stock}</span>
              </p>
            </div>

          )}

          {/* 🛒 Үйлдлийн товчлуурууд */}
          <div className="action-buttons">
            <button
              className={`cart-btn ${isOutOfStock ? "disabled" : ""}`}
              // disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              🛒 Сагсанд хийх
            </button>
            <button
              className={`buy-btn ${isOutOfStock ? "disabled" : ""}`}
              // disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              💳 Худалдан авах
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
