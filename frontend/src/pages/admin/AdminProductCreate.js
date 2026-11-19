import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";

const emptyForm = {
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

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState({
    categories: [],
    brands: [],
    models: [],
    specFields: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [specs, setSpecs] = useState([]);
  const [optionSaving, setOptionSaving] = useState(false);

  const imagePreviewList = useMemo(
    () =>
      Array.isArray(form.images)
        ? form.images
            .map((img) => (typeof img === "string" ? img.trim() : ""))
            .filter(Boolean)
        : [],
    [form.images]
  );

  const specOptions = options.specFields || [];
  const inlineLabelHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
  };
  const inlineAddButtonStyle = {
    fontSize: "0.85rem",
    padding: "0.35rem 0.9rem",
    whiteSpace: "nowrap",
  };

  // 🔹 Брэнд, моделын холбоосыг тодорхойлно
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
      const modelCategoryId = getModelCategoryId(model);
      const brandId = getModelBrandId(model);
      if (!modelCategoryId || !brandId) {
        return;
      }
      if (!map[modelCategoryId]) {
        map[modelCategoryId] = new Set();
      }
      map[modelCategoryId].add(brandId);
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
    return `/${normalized}`;
  };

  const sendOptionRequest = async (endpoint, payload) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      throw new Error("Админ эрх шаардлагатай.");
    }

    const response = await fetch(`/admin/products/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "Тохиргооны мэдээлэл нэмэхэд алдаа гарлаа.");
    }
    return data;
  };

  const handleAddCategoryOption = async () => {
    const name = window.prompt("Шинэ ангиллын нэрийг оруулна уу.");
    if (!name || !name.trim()) {
      return;
    }

    setOptionSaving(true);
    setError("");
    try {
      const data = await sendOptionRequest("categories", { name: name.trim() });
      const newCategory = data?.category;
      if (!newCategory) {
        throw new Error("Ангиллын мэдээлэл буцаагдсангүй.");
      }
      setOptions((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory],
      }));
      setForm((prev) => ({
        ...prev,
        category_id: String(newCategory.id),
        brand_id: "",
        model_id: "",
      }));
    } catch (err) {
      setError(err.message || "Ангилал нэмэхэд алдаа гарлаа.");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleAddBrandOption = async () => {
    if (!form.category_id) {
      setError("Брэнд нэмэхийн өмнө ангилал сонгоно уу.");
      return;
    }
    const name = window.prompt("Шинэ брэндийн нэрийг оруулна уу.");
    if (!name || !name.trim()) {
      return;
    }

    setOptionSaving(true);
    setError("");
    try {
      const data = await sendOptionRequest("brands", {
        name: name.trim(),
        category_id: Number(form.category_id),
      });
      const newBrand = data?.brand;
      if (!newBrand) {
        throw new Error("Брэндийн мэдээлэл буцаагдсангүй.");
      }
      setOptions((prev) => ({
        ...prev,
        brands: [...(prev.brands || []), newBrand],
      }));
      setForm((prev) => ({
        ...prev,
        brand_id: String(newBrand.id),
        model_id: "",
      }));
    } catch (err) {
      setError(err.message || "Брэнд нэмэхэд алдаа гарлаа.");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleAddModelOption = async () => {
    if (!form.brand_id) {
      setError("Модел нэмэхийн өмнө брэнд сонгоно уу.");
      return;
    }
    const name = window.prompt("Шинэ моделийн нэрийг оруулна уу.");
    if (!name || !name.trim()) {
      return;
    }

    setOptionSaving(true);
    setError("");
    try {
      const data = await sendOptionRequest("models", {
        name: name.trim(),
        brand_id: Number(form.brand_id),
        category_id: form.category_id ? Number(form.category_id) : null,
      });
      const newModel = data?.model;
      if (!newModel) {
        throw new Error("Моделийн мэдээлэл буцаагдсангүй.");
      }
      setOptions((prev) => ({
        ...prev,
        models: [...(prev.models || []), newModel],
      }));
      setForm((prev) => ({
        ...prev,
        model_id: String(newModel.id),
      }));
    } catch (err) {
      setError(err.message || "Модел нэмэхэд алдаа гарлаа.");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleAddSpecFieldOption = async () => {
    const name = window.prompt("Шинэ үзүүлэлтийн нэрийг оруулна уу.");
    if (!name || !name.trim()) {
      return;
    }

    setOptionSaving(true);
    setError("");
    try {
      const data = await sendOptionRequest("spec-fields", { name: name.trim() });
      const newField = data?.specField;
      if (!newField) {
        throw new Error("Үзүүлэлтийн мэдээлэл буцаагдсангүй.");
      }
      setOptions((prev) => ({
        ...prev,
        specFields: [...(prev.specFields || []), newField],
      }));
      setSpecs((prev) => [
        ...prev,
        {
          id: `new-spec-${Date.now()}`,
          field_id: String(newField.id),
          value: "",
        },
      ]);
    } catch (err) {
      setError(err.message || "Үзүүлэлт нэмэхэд алдаа гарлаа.");
    } finally {
      setOptionSaving(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setLoading(true);

    fetch("/admin/products/options", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Сонголтын мэдээлэл татахад алдаа гарлаа.");
        }
        return response.json();
      })
      .then((data) => {
        setOptions({
          categories: data.categories || [],
          brands: data.brands || [],
          models: data.models || [],
          specFields: data.specFields || [],
        });
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => {
      let next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Ангилал солигдоход брэнд, моделийг reset
      if (name === "category_id") {
        next = { ...next, brand_id: "", model_id: "" };
      }

      // Брэнд солигдоход моделийг reset
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

  const handleAddImage = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.imageUrl) {
        throw new Error(data?.error || "Зураг upload хийхэд алдаа гарлаа.");
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, data.imageUrl],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Зураг upload хийхэд алдаа гарлаа.");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveImage = async (index) => {
    const imageUrl = form.images[index];
    if (!imageUrl) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const confirmed = window.confirm("Зургийг устгах уу?");
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch("/api/admin/upload/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: null, image_url: imageUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Зураг устгахад алдаа гарлаа.");
      }
    } catch (err) {
      console.error("Delete image error:", err);
      setError(err.message || "Зураг устгахад алдаа гарлаа.");
      return;
    }

    setForm((prev) => {
      const nextImages = [...prev.images];
      nextImages.splice(index, 1);
      return { ...prev, images: nextImages };
    });
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

    fetch("/admin/products", {
      method: "POST",
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
            throw new Error(data?.error || "Бүтээгдэхүүн нэмэхэд алдаа гарлаа.");
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
    return (
      <p className="users-placeholder">
        Сонголтын мэдээлэл ачаалж байна...
      </p>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <h1>Бүтээгдэхүүн нэмэх</h1>
        <button
          className="ghost-btn"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          Буцах
        </button>
      </div>

      <div className="product-edit-layout">
        <form className="product-edit-grid" onSubmit={handleSubmit}>
          <section className="product-card product-card-main">
            <h2 className="product-card-title">Үндсэн мэдээлэл</h2>
            <div className="product-primary-columns">
              <div className="product-main-left single-column">
                <label>
                  <span>Бүтээгдэхүүний код</span>
                  <input
                    type="text"
                    name="product_code"
                    value={form.product_code}
                    onChange={handleChange}
                    placeholder="SKU-001"
                  />
                </label>
                <label>
                  <span>Нэр*</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Бүтээгдэхүүний нэр"
                  />
                </label>
                <label>
                  <span>Тайлбар</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар"
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
                    placeholder="0.00"
                  />
                </label>
                <label>
                  <div style={inlineLabelHeaderStyle}>
                    <span>Ангилал*</span>
                    <button
                      type="button"
                      className="ghost-btn inline-add-btn"
                      style={inlineAddButtonStyle}
                      onClick={handleAddCategoryOption}
                      disabled={optionSaving}
                    >
                      + Шинэ ангилал
                    </button>
                  </div>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                  >
                    <option value="">Сонгох</option>
                    {options.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* 🔹 Брэнд – сонгосон ангилалын брэндүүд */}
                <label>
                  <div style={inlineLabelHeaderStyle}>
                    <span>Брэнд</span>
                    <button
                      type="button"
                      className="ghost-btn inline-add-btn"
                      style={inlineAddButtonStyle}
                      onClick={handleAddBrandOption}
                      disabled={optionSaving || !form.category_id}
                    >
                      + Шинэ брэнд
                    </button>
                  </div>
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

                {/* 🔹 Модел – зөвхөн сонгосон брэндийн моделууд */}
                <label>
                  <div style={inlineLabelHeaderStyle}>
                    <span>Модел</span>
                    <button
                      type="button"
                      className="ghost-btn inline-add-btn"
                      style={inlineAddButtonStyle}
                      onClick={handleAddModelOption}
                      disabled={optionSaving || !form.brand_id}
                    >
                      + Шинэ модел
                    </button>
                  </div>
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
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </label>
                <label>
                  <span>Хөнгөлөлт (%)</span>
                  <input
                    type="number"
                    name="discount_percent"
                    value={form.discount_percent}
                    onChange={handleChange}
                    placeholder="0"
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                  />
                </label>
              </div>

              {!imagePreviewList.length ? (
                <p className="specs-placeholder">
                  Одоогоор зураг нэмэгдээгүй байна. Зураг upload хийх эсвэл
                  холбоосоор оруулна уу.
                </p>
              ) : null}
            </div>
          </section>

          <section className="product-card product-card-specs">
            <div className="specs-panel-header">
              <h2>Бүтээгдэхүүний үзүүлэлт</h2>
              <button
                type="button"
                className="ghost-btn inline-add-btn"
                style={inlineAddButtonStyle}
                onClick={handleAddSpecFieldOption}
                disabled={optionSaving}
              >
                + Шинэ үзүүлэлт
              </button>
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
                            onChange={(event) =>
                              handleSpecFieldChange(index, event.target.value)
                            }
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
                            onChange={(event) =>
                              handleSpecValueChange(index, event.target.value)
                            }
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
                        Үзүүлэлтийн мөр байхгүй байна.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <p className="specs-placeholder">
                Үзүүлэлтийн талбаруудыг татахад алдаа гарлаа эсвэл тохиргоо
                хийгдээгүй байна.
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
              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
              >
                {submitting ? "Хадгалж байна..." : "Бүтээгдэхүүн нэмэх"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default AdminProductCreate;
