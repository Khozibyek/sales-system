import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const resolveAssetUrl = (path) => {
    if (!path || typeof path !== "string") {
      return "";
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const normalized = path.replace(/^\/+/, "").replace(/\\/g, "/");
    return `http://localhost:5050/${normalized}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetch("http://localhost:5050/admin/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Бүтээгдэхүүн татахад алдаа гарлаа.");
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data.products)
          ? data.products.map((item) => ({
              ...item,
              main_image_url: resolveAssetUrl(item.main_image_url),
            }))
          : [];
        setProducts(items);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleDelete = (product) => {
    if (!window.confirm(`"${product.name}" бүтээгдэхүүнийг устгах уу?`)) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setDeletingId(product.id);

    fetch(`http://localhost:5050/admin/products/${product.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data?.error || "Бүтээгдэхүүн устгахад алдаа гарлаа.");
          });
        }
        return response.json();
      })
      .then(() => {
        setProducts((prev) => prev.filter((item) => item.id !== product.id));
        setError("");
        if (modalOpen) {
          setModalOpen(false);
          setModalData(null);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setDeletingId(null));
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalData(null);
    setModalLoading(false);
    setModalError("");
  };

  const handleShowDetail = (product) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setModalOpen(true);
    setModalData({ ...product, images: [], specs: [] });
    setModalLoading(true);
    setModalError("");

    fetch(`http://localhost:5050/admin/products/${product.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Бүтээгдэхүүний мэдээлэл татахад алдаа гарлаа.");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.product) {
          throw new Error("Бүтээгдэхүүн олдсонгүй.");
        }

        setModalData((prev) => ({
          ...prev,
          ...data.product,
          category_name:
            data.product.category_name ?? prev?.category_name ?? product.category_name ?? "",
          brand_name:
            data.product.brand_name ?? prev?.brand_name ?? product.brand_name ?? "",
          model_name:
            data.product.model_name ?? prev?.model_name ?? product.model_name ?? "",
          main_image_url: resolveAssetUrl(
            data.product.main_image_url ?? prev?.main_image_url ?? product.main_image_url
          ),
          images: Array.isArray(data.product.images)
            ? data.product.images
                .map((img) => {
                  if (typeof img === "string") {
                    const url = resolveAssetUrl(img);
                    return url ? { url } : null;
                  }
                  const rawUrl = img?.url || img?.image_url || "";
                  const url = resolveAssetUrl(rawUrl);
                  if (!url) {
                    return null;
                  }
                  return { ...img, url };
                })
                .filter(Boolean)
            : [],
          specs: Array.isArray(data.product.specs)
            ? data.product.specs
                .map((spec) => {
                  if (!spec || (!spec.field_name && !spec.name)) {
                    return null;
                  }
                  const label = spec.field_name || spec.name;
                  const value =
                    spec.value && String(spec.value).trim().length
                      ? String(spec.value).trim()
                      : "-";
                  return { label, value };
                })
                .filter(Boolean)
            : [],
        }));
        setModalError("");
      })
      .catch((err) => {
        setModalError(err.message);
      })
      .finally(() => setModalLoading(false));
  };

  return (
    <div className="admin-products-page">
      <div className="users-header">
        <h1>Бүтээгдэхүүний жагсаалт</h1>
        <button className="primary-btn" onClick={() => navigate("/admin/products/new")}>
          Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {loading ? (
        <p className="users-placeholder">Ачаалж байна...</p>
      ) : error ? (
        <p className="users-placeholder error">{error}</p>
      ) : products.length === 0 ? (
        <p className="users-placeholder">Бүтээгдэхүүн олдсонгүй.</p>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Код</th>
                <th>Нэр</th>
                <th>Ангилал</th>
                <th>Үнэ</th>
                <th>Үлдэгдэл</th>
                <th>Онцлох</th>
                <th>Огноо</th>
                <th>Үзэх</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>{product.product_code || "-"}</td>
                  <td>{product.name}</td>
                  <td>{product.category_name || "-"}</td>
                  <td>{Number(product.price).toLocaleString("mn-MN")}₮</td>
                  <td>{product.stock}</td>
                  <td>{product.is_featured ? "Тийм" : "Үгүй"}</td>
                  <td>
                    {product.created_at
                      ? new Date(product.created_at).toLocaleDateString("mn-MN")
                      : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="action-btn icon-btn"
                      onClick={() => handleShowDetail(product)}
                      aria-label={`${product.name} бүтээгдэхүүнийг үзэх`}
                    >
                      <FiEye />
                      <span>Үзэх</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-backdrop" onClick={handleCloseModal} />
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h2>{modalData?.name || "Бүтээгдэхүүний дэлгэрэнгүй"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              {modalLoading ? (
                <p className="users-placeholder">Ачаалж байна...</p>
              ) : modalError ? (
                <p className="users-placeholder error">{modalError}</p>
              ) : modalData ? (
                <div className="product-modal-layout">
                  <div className="product-modal-main">
                    <div className="product-info-grid">
                      <div className="product-info-card">
                        <span className="info-label">Код</span>
                        <span className="info-value">{modalData.product_code || "-"}</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Ангилал</span>
                        <span className="info-value">{modalData.category_name || "-"}</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Брэнд</span>
                        <span className="info-value">{modalData.brand_name || "-"}</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Модел</span>
                        <span className="info-value">{modalData.model_name || "-"}</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Үнэ</span>
                        <span className="info-value">
                          {Number(modalData.price || 0).toLocaleString("mn-MN")}₮
                        </span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Үлдэгдэл</span>
                        <span className="info-value">{modalData.stock ?? 0}</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Хөнгөлөлт</span>
                        <span className="info-value">{modalData.discount_percent || 0}%</span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Онцлох</span>
                        <span
                          className={`info-value ${modalData.is_featured ? "info-featured" : ""}`}
                        >
                          {modalData.is_featured ? "Тийм" : "Үгүй"}
                        </span>
                      </div>
                      <div className="product-info-card">
                        <span className="info-label">Үүссэн огноо</span>
                        <span className="info-value">
                          {modalData.created_at
                            ? new Date(modalData.created_at).toLocaleString("mn-MN")
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="product-description-card">
                      <h3>Тайлбар</h3>
                      <p>{modalData.description || "Тайлбар байхгүй"}</p>
                    </div>
                    <div className="product-specs-card">
                      <h3>Бүтээгдэхүүний үзүүлэлт</h3>
                      {modalData.specs && modalData.specs.length ? (
                        <table className="product-specs-table">
                          <tbody>
                            {modalData.specs.map((spec, index) => (
                              <tr key={`${spec.label}-${index}`}>
                                <th>{spec.label}</th>
                                <td>{spec.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="specs-placeholder">Үзүүлэлтийн мэдээлэл байхгүй.</p>
                      )}
                    </div>
                  </div>
                  <div className="product-modal-sidebar">
                    <h3>Зурагнууд</h3>
                    {modalData.images && modalData.images.length ? (
                      <div className="product-images">
                        {modalData.images.map((img, index) => (
                          <img key={`${img.url}-${index}`} src={img.url} alt={`product-${index}`} />
                        ))}
                      </div>
                    ) : (
                      <p className="users-placeholder">Зураг нэмэгдээгүй.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            {modalData ? (
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/admin/products/${modalData.id}/edit`);
                  }}
                >
                  Засах
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  onClick={() => handleDelete(modalData)}
                  disabled={deletingId === modalData.id}
                >
                  {deletingId === modalData.id ? "Устгаж байна..." : "Устгах"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
