import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import addressOptions from "../../data/addresses.json";

const AdminUserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", active: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressForm, setAddressForm] = useState({
    city: "",
    district: "",
    subdistrict: "",
    addressDetail: "",
    altPhone: "",
  });
  const [addressError, setAddressError] = useState("");
  const [addressLoading, setAddressLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetch(`/admin/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Хэрэглэгчийн мэдээлэл татахад алдаа гарлаа.");
        }
        return response.json();
      })
      .then((data) => {
        if (!data.user) {
          throw new Error("Хэрэглэгч олдсонгүй.");
        }

        setForm({
          name: data.user.name || "",
          email: data.user.email || "",
          phone:
            data.user.phone === null || data.user.phone === undefined
              ? ""
              : String(data.user.phone),
          password: "",
          active: data.user.active === 0 ? false : true,
        });
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));

    fetch(`/admin/users/${id}/address`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Хаягийн мэдээлэл татахад алдаа гарлаа.");
        }
        return response.json();
      })
      .then((data) => {
        const address = data.address || {};
        setAddressForm({
          city: address.city || "",
          district: address.district || "",
          subdistrict: address.subdistrict || "",
          addressDetail: address.address_detail || "",
          altPhone: address.alt_phone || "",
        });
        setAddressError("");
      })
      .catch((err) => {
        setAddressError(err.message);
      })
      .finally(() => setAddressLoading(false));
  }, [id, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const districts = useMemo(() => {
    if (!addressForm.city || !addressOptions[addressForm.city]) return [];
    return Object.keys(addressOptions[addressForm.city]);
  }, [addressForm.city]);

  const subdistricts = useMemo(() => {
    if (!addressForm.city || !addressForm.district) return [];
    return addressOptions[addressForm.city]?.[addressForm.district] || [];
  }, [addressForm.city, addressForm.district]);

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => {
      if (name === "city") {
        return { ...prev, city: value, district: "", subdistrict: "" };
      }
      if (name === "district") {
        return { ...prev, district: value, subdistrict: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name || !form.email) {
      setError("Нэр, имэйл талбаруудыг бөглөнө үү.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setSubmitting(true);
    setError("");
    setAddressError("");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const phoneValue =
      form.phone === null || form.phone === undefined
        ? ""
        : String(form.phone);

    const userPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: phoneValue.trim() || null,
      password: form.password || undefined,
      active: form.active ? 1 : 0,
    };

    const shouldUpdateAddress =
      addressForm.city ||
      addressForm.district ||
      addressForm.subdistrict ||
      addressForm.addressDetail ||
      addressForm.altPhone;

    fetch(`/admin/users/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(userPayload),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data?.error || "Хэрэглэгчийн мэдээлэл шинэчлэхэд алдаа гарлаа.");
          });
        }
        return response.json();
      })
      .then(() => {
        if (!shouldUpdateAddress) {
          return Promise.resolve();
        }

        if (!addressForm.city || !addressForm.district || !addressForm.subdistrict) {
          throw new Error("Хот, дүүрэг, хороо талбаруудыг сонгоно уу.");
        }

        return fetch(`/admin/users/${id}/address`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            city: addressForm.city,
            district: addressForm.district,
            subdistrict: addressForm.subdistrict,
            addressDetail: addressForm.addressDetail,
            altPhone: addressForm.altPhone || null,
          }),
        }).then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data?.error || "Хаягийн мэдээлэл хадгалахад алдаа гарлаа.");
            });
          }
          return response.json();
        });
      })
      .then(() => {
        navigate("/admin/users");
      })
      .catch((err) => {
        if (err.message.includes("Хаяг")) {
          setAddressError(err.message);
        } else {
          setError(err.message);
        }
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return <p className="users-placeholder">Мэдээлэл ачаалж байна...</p>;
  }

  return (
    <div className="admin-users-page">
      <div className="users-header">
        <h1>Хэрэглэгчийн мэдээлэл засах</h1>
        <button className="ghost-btn" onClick={() => navigate(-1)} disabled={submitting}>
          Буцах
        </button>
      </div>

      <form className="admin-user-edit-form" onSubmit={handleSubmit}>
        <div className="admin-user-edit-grid">
          <div className="users-form-wrapper">
            <div className="users-form">
              <label>
                <span>Нэр*</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ж. Бат"
                />
              </label>
              <label>
                <span>Имэйл*</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                />
              </label>
              <label>
                <span>Утас</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="88881234"
                />
              </label>
              <label>
                <span>Нууц үг (шинэчлэх бол)</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </label>
              {error ? <p className="users-placeholder error">{error}</p> : null}
            </div>
          </div>

          <div className="users-form-wrapper">
            {addressLoading ? (
              <p className="users-placeholder">Хаяг ачаалж байна...</p>
            ) : (
              <div className="users-form">
                <label>
                  <span>Хот / Аймаг</span>
                  <select name="city" value={addressForm.city} onChange={handleAddressChange}>
                    <option value="">Сонгох</option>
                    {Object.keys(addressOptions).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Дүүрэг / Сум</span>
                  <select
                    name="district"
                    value={addressForm.district}
                    onChange={handleAddressChange}
                    disabled={!addressForm.city}
                  >
                    <option value="">Сонгох</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Хороо / Баг</span>
                  <select
                    name="subdistrict"
                    value={addressForm.subdistrict}
                    onChange={handleAddressChange}
                    disabled={!addressForm.district}
                  >
                    <option value="">Сонгох</option>
                    {subdistricts.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Дэлгэрэнгүй хаяг</span>
                  <input
                    type="text"
                    name="addressDetail"
                    value={addressForm.addressDetail}
                    onChange={handleAddressChange}
                    placeholder="Байр, орц, тоот ..."
                  />
                </label>
                <label>
                  <span>Нэмэлт утас</span>
                  <input
                    type="tel"
                    name="altPhone"
                    value={addressForm.altPhone}
                    onChange={handleAddressChange}
                    placeholder="Нэмэлт утас"
                  />
                </label>
                {addressError ? <p className="users-placeholder error">{addressError}</p> : null}
              </div>
            )}
          </div>
        </div>
        <div className="users-actions align-right">
          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserEdit;
