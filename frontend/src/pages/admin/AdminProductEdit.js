import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";

const emptyProduct = {
  product_code: "",
  name: "",
  description: "",
  price: "",
  category_id: "",
  brand_id: "",
  model_id: "",
  stock: "0",
  discount_percent: "0",
  is_featured: false,
  images: [],
};

const AdminProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyProduct);
  const [options, setOptions] = useState({ categories: [], brands: [], models: [], specFields: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [specs, setSpecs] = useState([]);
  const imagesTextareaRef = useRef(null);
  

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setLoading(true);

    const fetchOptions = fetch("http://localhost:5050/admin/products/options", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Сонголтын мэдээлэл татахад алдаа гарлаа.");
      }
      return response.json();
    });

    const fetchProduct = fetch(`http://localhost:5050/admin/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Бүтээгдэхүүний мэдээлэл татахад алдаа гарлаа.");
      }
      return response.json();
    });

    Promise.all([fetchOptions, fetchProduct])
      .then(([optionsData, productData]) => {
        setOptions({
          categories: optionsData.categories || [],
          brands: optionsData.brands || [],
          models: optionsData.models || [],
          specFields: optionsData.specFields || [],
        });

        if (!productData.product) {
          throw new Error("Бүтээгдэхүүн олдсонгүй.");
        }

        const product = productData.product;
        const imageList = Array.isArray(product.images)
          ? product.images
            .map((img) => (typeof img === "string" ? img : img?.url))
            .filter((img) => typeof img === "string" && img.length)
          : [];

        setForm({
          product_code: product.product_code || "",
          name: product.name || "",
          description: product.description || "",
          price: product.price !== undefined && product.price !== null ? String(product.price) : "",
          category_id:
            product.category_id !== undefined && product.category_id !== null
              ? String(product.category_id)
              : "",
          brand_id:
            product.brand_id !== undefined && product.brand_id !== null
              ? String(product.brand_id)
              : "",
          model_id:
            product.model_id !== undefined && product.model_id !== null
              ? String(product.model_id)
              : "",
          stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : "0",
          discount_percent:
            product.discount_percent !== undefined && product.discount_percent !== null
              ? String(product.discount_percent)
              : "0",
          is_featured: product.is_featured ? true : false,
          images: imageList,
        });
        const initialSpecs = Array.isArray(product.specs)
          ? product.specs.map((spec, index) => ({
            id: spec.spec_id ? String(spec.spec_id) : `existing-${index}`,
            field_id: spec.field_id ? String(spec.field_id) : "",
            value: spec.value || "",
          }))
          : [];
        setSpecs(initialSpecs);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const imagesText = useMemo(() => form.images.join("\n"), [form.images]);
  const imagePreviewList = useMemo(
    () =>
      Array.isArray(form.images)
        ? form.images.map((img) => (typeof img === "string" ? img.trim() : "")).filter(Boolean)
        : [],
    [form.images]
  );
  const specOptions = options.specFields || [];

  // 🔹 Брэнд, моделийн холбоосууд
  const getBrandCategoryId = (brand) =>
    String(brand.category_id ?? brand.categoryId ?? brand.category ?? "");
  const getModelBrandId = (model) =>
    String(model.brand_id ?? model.brandId ?? model.brand ?? "");
  const getModelCategoryId = (model) =>
    String(model.category_id ?? model.categoryId ?? model.category ?? "");

  const categoryBrandMap = useMemo(() => {
    const map = {};
    (options.brands || []).forEach((brand) => {
      const brandId = String(brand.id ?? "");
      const categoryId = getBrandCategoryId(brand);
      if (!brandId || !categoryId) {
        return;
      }
      if (!map[categoryId]) {
        map[categoryId] = new Set();
      }
      map[categoryId].add(brandId);
    });
    (options.models || []).forEach((model) => {
      const categoryId = getModelCategoryId(model);
      const brandId = getModelBrandId(model);
      if (!categoryId || !brandId) {
        return;
      }
      if (!map[categoryId]) {
        map[categoryId] = new Set();
      }
      map[categoryId].add(brandId);
    });
    return map;
  }, [options.brands, options.models]);

  const filteredBrands = useMemo(() => {
    const brands = options.brands || [];
    if (!form.category_id) return brands;
    const categoryId = String(form.category_id);
    const allowedBrands = categoryBrandMap[categoryId];
    return brands.filter((brand) => {
      const brandId = String(brand.id ?? "");
      if (!brandId) {
        return false;
      }
      if (allowedBrands && allowedBrands.size) {
        return allowedBrands.has(brandId);
      }
      const brandCategoryId = getBrandCategoryId(brand);
      return brandCategoryId ? brandCategoryId === categoryId : false;
    });
  }, [options.brands, categoryBrandMap, form.category_id]);

  const filteredModels = useMemo(() => {
    const models = options.models || [];
    if (!form.brand_id) return [];
    const brandId = String(form.brand_id);
    const selectedCategoryId = form.category_id
      ? String(form.category_id)
      : "";
    return models.filter((model) => {
      const modelBrandId = getModelBrandId(model);
      if (!modelBrandId || modelBrandId !== brandId) {
        return false;
      }
      if (!selectedCategoryId) {
        return true;
      }
      const modelCategoryId = getModelCategoryId(model);
      if (!modelCategoryId) {
        return true;
      }
      return modelCategoryId === selectedCategoryId;
    });
  }, [options.models, form.brand_id, form.category_id]);

  const resolveImageUrl = (path) => {
    if (!path || typeof path !== "string") {
      return "";
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const normalized = path.replace(/^\/+/, "").replace(/\\/g, "/");
    return `http://localhost:5050/${normalized}`;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      let next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "category_id") {
        next = { ...next, brand_id: "", model_id: "" };
      }

      if (name === "brand_id") {
        next = { ...next, model_id: "" };
      }

      return next;
    });
  };

  const handleImagesChange = (event) => {
    const values = event.target.value
      .split(/\r?\n/)
      .map((img) => img.trim())
      .filter((img) => img.length);
    setForm((prev) => ({ ...prev, images: values }));
  };

  const handleSpecChange = (index, key, value) => {
    setSpecs((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  const handleSpecFieldChange = (index, fieldId) => {
    handleSpecChange(index, "field_id", fieldId);
  };

  const handleSpecValueChange = (index, value) => {
    handleSpecChange(index, "value", value);
  };

  const handleAddSpec = () => {
    setSpecs((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        field_id: "",
        value: "",
      },
    ]);
  };

  const handleRemoveSpec = (index) => {
    setSpecs((prev) => prev.filter((_, idx) => idx !== index));
  };

const handleAddImage = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("product_id", id);

  try {
    const res = await fetch("http://localhost:5050/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, data.imageUrl],
      }));
    } else {
      alert("Алдаа: " + data.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload хийхэд алдаа гарлаа.");
  }
};

const handleRemoveImage = async (index) => {
  const confirmed = window.confirm("Зургийг устгах уу?");
  if (!confirmed) return;

  const imageUrl = form.images[index]; // устгах зураг
  const productId = id; // тухайн бүтээгдэхүүний id

  try {
    const res = await fetch("http://localhost:5050/api/admin/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, image_url: imageUrl }),
    });

    const data = await res.json();

    if (res.ok) {
      setForm((prev) => {
        const updated = [...prev.images];
        updated.splice(index, 1);
        return { ...prev, images: updated };
      });

      toast.success('Зураг усатгагдлаа')
    } else {
      alert("Алдаа: " + data.error);
    }
  } catch (err) {
    console.error("Delete image error:", err);
    alert("Сервертэй холбогдох үед алдаа гарлаа!");
  }
};



  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.price || !form.category_id) {
      setError("Нэр, үнэ, ангилал талбаруудыг бөглөнө үү.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setSubmitting(true);
    setError("");

    const imagesArray = Array.isArray(form.images)
      ? form.images
        .map((img) => (typeof img === "string" ? img.trim() : ""))
        .filter((img) => img.length)
      : [];

    const specsPayload = specs
      .filter((spec) => spec.field_id && spec.value && spec.value.trim().length)
      .map((spec) => ({
        field_id: Number(spec.field_id),
        value: spec.value.trim(),
      }));

    fetch(`http://localhost:5050/admin/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_code: form.product_code || null,
        name: form.name,
        description: form.description,
        price: form.price,
        category_id: form.category_id,
        brand_id: form.brand_id || null,
        model_id: form.model_id || null,
        stock: form.stock || 0,
        discount_percent: form.discount_percent || 0,
        is_featured: form.is_featured,
        images: imagesArray,
        specs: specsPayload,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data?.error || "Бүтээгдэхүүн шинэчлэхэд алдаа гарлаа.");
          });
        }
        return response.json();
      })
      .then(() => {
        navigate("/admin/products");
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return <p className="users-placeholder">Мэдээлэл ачаалж байна...</p>;
  }

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <h1>Бүтээгдэхүүн засах</h1>
        <button className="ghost-btn" onClick={() => navigate(-1)} disabled={submitting}>
          Буцах
        </button>
      </div>

      <div className="product-edit-layout">
        <form className="product-edit-grid" onSubmit={handleSubmit}>
          <section className="product-card product-card-main">
            <h2 className="product-card-title">Үндсэн мэдээлэл</h2>
            <div className="product-primary-columns">
              <div className="product-main-left">
                <label>
                  <span>Бүтээгдэхүүний код</span>
                  <input
                    type="text"
                    name="product_code"
                    value={form.product_code}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  <span>Нэр*</span>
                  <input type="text" name="name" value={form.name} onChange={handleChange} />
                </label>
                <label>
                  <span>Тайлбар</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                  />
                </label>
                <label>
                  <span>Үнэ*</span>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  <span>Ангилал*</span>
                  <select name="category_id" value={form.category_id} onChange={handleChange}>
                    <option value="">Сонгох</option>
                    {options.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Брэнд</span>
                  <select
                    name="brand_id"
                    value={form.brand_id}
                    onChange={handleChange}
                    disabled={!form.category_id}
                  >
                    <option value="">Сонгох</option>
                    {filteredBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Модел</span>
                  <select
                    name="model_id"
                    value={form.model_id}
                    onChange={handleChange}
                    disabled={!form.brand_id}
                  >
                    <option value="">Сонгох</option>
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Үлдэгдэл</span>
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} />
                </label>
                <label>
                  <span>Хөнгөлөлт (%)</span>
                  <input
                    type="number"
                    name="discount_percent"
                    value={form.discount_percent}
                    onChange={handleChange}
                  />
                </label>
                <label className="users-checkbox">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={form.is_featured}
                    onChange={handleChange}
                  />
                  <span>Онцлох бүтээгдэхүүн</span>
                </label>
              </div>
            </div>
            <div className="product-images-edit">
              <div className="image-actions">
                <h3>Зураг тохиргоо</h3>
              </div>
              {imagePreviewList.length ? (
                <div className="images-preview-grid">
                  {imagePreviewList.map((img, index) => {
                    const url = resolveImageUrl(img);

                    return (
                      <div className="images-preview-item" key={index}>
                        <button
                          type="button"
                          className="delete-image-btn"
                          onClick={() => handleRemoveImage(index)}
                        >
                          ×
                        </button>

                        <img src={url} alt={`preview-${index}`} />
                      </div>
                    );
                  })}

                  <label className="images-preview-item add-image-btn">
                    <FiPlus className="add-icon" />
                    <span>Зураг нэмэх</span>
                    <input type="file" accept="image/*" onChange={handleAddImage} />
                  </label>
                </div>
              ) : (
                <div className="images-empty-state">
                  <p className="specs-placeholder">Зураг оруулаагүй байна.</p>
                  <label className="images-preview-item add-image-btn">
                    <FiPlus className="add-icon" />
                    <span>Зураг нэмэх</span>
                    <input type="file" accept="image/*" onChange={handleAddImage} />
                  </label>
                </div>
              )}
            </div>
          </section>

          <section className="product-card product-card-specs">
            <div className="specs-panel-header">
              <h2>Бүтээгдэхүүний үзүүлэлт</h2>
              <p>Шаардлагатай үзүүлэлтүүдээ бөглөөд, үлдсэнийг хоосон үлдээж болно.</p>
            </div>

            {specOptions.length ? (
              <table className="product-specs-edit-table">
                <thead>
                  <tr>
                    <th>Үзүүлэлт</th>
                    <th>Утга</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {specs.length ? (
                    specs.map((spec, index) => (
                      <tr key={spec.id || index}>
                        <td>
                          <select
                            value={spec.field_id}
                            onChange={(event) => handleSpecFieldChange(index, event.target.value)}
                          >
                            <option value="">Сонгох</option>
                            {specOptions.map((option) => (
                              <option key={option.id} value={String(option.id)}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(event) => handleSpecValueChange(index, event.target.value)}
                            placeholder="Утга оруулна уу"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="spec-remove-btn"
                            onClick={() => handleRemoveSpec(index)}
                          >
                            Хасах
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="specs-empty-row">
                        Одоогоор үзүүлэлтийн мөр байхгүй.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <p className="specs-placeholder">
                Үзүүлэлтийн талбаруудыг татахад алдаа гарлаа эсвэл тохиргоо хийгдээгүй байна.
              </p>
            )}

            <button
              type="button"
              className="spec-add-btn"
              onClick={handleAddSpec}
              disabled={!specOptions.length}
            >
              <FiPlus />
            </button>

            {error ? <p className="users-placeholder error">{error}</p> : null}

            <div className="users-actions align-right">
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </section>

        </form>
      </div>
    </div>
  );
};

export default AdminProductEdit;
