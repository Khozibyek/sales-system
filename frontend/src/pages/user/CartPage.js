import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaUniversity,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/user/cart.css";

export default function CartPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [cart, setCart] = useState([]);
  const [step, setStep] = useState(1);
  const [hasChanged, setHasChanged] = useState(false);
  const [address, setAddress] = useState({ phone: "", alt_phone: "", location: "" });
  const [userPhone, setUserPhone] = useState("");
  const [addressData, setAddressData] = useState({});
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");

  // 🛒 Сагсны мэдээлэл татах
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`http://localhost:5050/api/cart/${userId}`)
      .then((res) => setCart(res.data))
      .catch((err) => console.error("Cart fetch error:", err));
  }, [userId]);

  // 🏠 Хаягийн мэдээлэл татах
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await axios.get(`http://localhost:5050/api/address/full/${userId}`);
        const { addressData, userAddress, phone, found } = res.data;

        setAddressData(addressData || {});
        setUserPhone(phone || "");

        if (found && userAddress) {
          setSelectedProvince(userAddress.city || "");
          setSelectedDistrict(userAddress.district || "");
          setSelectedSubdistrict(userAddress.subdistrict || "");
          setAddress({
            phone: String(phone || ""),
            alt_phone: userAddress.alt_phone || "",
            location: userAddress.address_detail || "",
          });
        } else {
          setSelectedProvince("");
          setSelectedDistrict("");
          setSelectedSubdistrict("");
          setAddress({ phone: String(phone || ""), alt_phone: "", location: "" });
        }
      } catch (err) {
        console.error("Address load error:", err);
      }
    };
    if (userId) fetchAddress();
  }, [userId]);

  // ✅ Хаягийн мэдээлэл шалгах
  useEffect(() => {
    if (
      selectedProvince.trim() &&
      selectedDistrict.trim() &&
      selectedSubdistrict.trim() &&
      address.location.trim()
    ) {
      setIsAddressValid(true);
    } else {
      setIsAddressValid(false);
    }
  }, [selectedProvince, selectedDistrict, selectedSubdistrict, address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // 🗑 Сагс устгах
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5050/api/cart/delete/${id}`);
      setCart((prev) => prev.filter((item) => item.cart_id !== id));
      toast.success("Амжилттай устгагдлаа");
    } catch (err) {
      toast.error("Сагс устгах үед алдаа гарлаа");
    }
  };

  // ➕➖ Тоо ширхэг нэмэх/хасах
  const handleQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cart_id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // ♻ Сагс хоослох
  const handleClear = async (showToast = true) => {
    try {
      for (const item of cart) {
        await axios.delete(`http://localhost:5050/api/cart/delete/${item.cart_id}`);
      }
      setCart([]);
      if (showToast) toast.success("Сагс хоослогдлоо");
    } catch (err) {
      if (showToast) toast.error("Сагс хоослох үед алдаа гарлаа");
    }
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, i) =>
      sum +
      i.quantity *
      (i.discount_percent
        ? i.price * (1 - i.discount_percent / 100)
        : i.price),
    0
  );

  const handleNextStep = () => {
    if (step === 2 && !isAddressValid) {
      toast.warn("Хаягийн бүх талбарыг бөглөнө үү!");
      return;
    }
    if (step < 3) setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  // Хаяг хадгалаад захиалга үүсгэх
  const handlePayAndSaveAddress = async () => {
    try {
      const res = await axios.post("http://localhost:5050/api/address/upsert", {
        user_id: userId,
        city: selectedProvince,
        district: selectedDistrict,
        subdistrict: selectedSubdistrict,
        address_detail: address.location,
        alt_phone: address.alt_phone,
      });

      const addressId = res.data.address_id;

      await axios.post("http://localhost:5050/api/orders/create", {
        user_id: userId,
        address_id: addressId,
        total_price: totalPrice,
        payment_method: selectedPayment,
        cart_items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.discount_percent
            ? item.price * (1 - item.discount_percent / 100)
            : item.price,
        })),
      });

      await handleClear(false);
      setStep(4);
    } catch (e) {
      console.error("Order Error:", e);
      toast.error("Захиалгын үед алдаа гарлаа.");
    }
  };

  const getNextButtonText = () => {
    if (step === 1) return "ХУДАЛДАН АВАХ";
    if (step === 2) return "ТӨЛБӨР ТӨЛӨХ";
    if (step === 3) return "ЗАХИАЛАХ";
  };

  const handleNextAction = () => {
    if (step === 3) handlePayAndSaveAddress();
    else handleNextStep();
  };

  return (
    <div className="cart-page">
      {/* Шатнууд */}
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? "active" : ""}`} title="Сагс"><FaShoppingCart /></div>
        <div className={`line ${step >= 2 ? "active" : ""}`}></div>
        <div className={`step ${step >= 2 ? "active" : ""}`} title="Хаяг"><FaMapMarkerAlt /></div>
        <div className={`line ${step >= 3 ? "active" : ""}`}></div>
        <div className={`step ${step >= 3 ? "active" : ""}`} title="Төлбөр"><FaCreditCard /></div>
        <div className={`line ${step >= 4 ? "active" : ""}`}></div>
        <div className={`step ${step >= 4 ? "active" : ""}`} title="Амилттай"><i className="fa-solid fa-check"></i></div>
      </div>

      {/* Үндсэн layout */}
      <div className="cart-layout">
        <div className="cart-left">
          {/* === 1-р шат — Сагсны хэсэг === */}
          {step === 1 && (
            <div className="cart-items">
              <div className="cart-header">
                <h2>Миний сагс ({cart.length})</h2>
                {cart.length > 0 && (
                  <button className="clear-cart" onClick={handleClear}>
                    🗑 Сагс хоослох
                  </button>
                )}
              </div>
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Сагс хоосон байна</p>
                </div>
              ) : (
                cart.map((item) => {
                  const discounted =
                    item.discount_percent && item.discount_percent > 0;
                  const price = discounted
                    ? item.price * (1 - item.discount_percent / 100)
                    : item.price;
                  return (
                    <div key={item.cart_id} className="cart-card">
                      <div className="cart-img-wrapper">
                        {item.discount_percent && Number(item.discount_percent) > 0 ? (
                          <span className="discount-badge">-{item.discount_percent}%</span>
                        ) : null}

                        <img
                          src={`http://localhost:5050/${item.main_image}`}
                          alt={item.name}
                          className="cart-img"
                          onClick={() => navigate(`/user/product/${item.product_id}`)}
                        />
                      </div>

                      <div className="cart-info">
                        <p className="brand">{item.brand_name}</p>
                        <h3
                          className="product-name"
                          onClick={() =>
                            navigate(`/user/product/${item.product_id}`)
                          }
                        >
                          {item.name}
                        </h3>
                      </div>
                      <div className="cart-price">
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.cart_id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>

                        {discounted ? (
                          <div className="cart-price-wrapper">
                            <p className="cart-discounted">
                              {price.toLocaleString()}₮
                            </p>
                            <p className="cart-old">
                              {item.price.toLocaleString()}₮
                            </p>
                          </div>
                        ) : (
                          <p className="cart-price-value">
                            {item.price.toLocaleString()}₮
                          </p>
                        )}

                        <div className="qty-control">
                          <button onClick={() => handleQty(item.cart_id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => {
                              if (item.stock > item.quantity) handleQty(item.cart_id, 1);
                            }}
                          >
                            +
                          </button>
                        </div>

                        <p className="stock-status">
                          Үлдэгдэл:{" "}
                          <span className={item.stock > 0 ? "in-stock" : "out-of-stock"}>
                            {item.stock > 0 ? `${item.stock} ширхэг` : "Дууссан"}
                          </span>
                        </p>

                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* === 2-р шат — Хаяг === */}
          {step === 2 && (
            <div className="checkout-step-content">
              <div className="address-card">
                <h3 className="address-title"> <FaMapMarkerAlt className="address-icon" /> Хүргэлтийн хаяг </h3>
                <form className="address-form">
                  <div className="form-group">
                    <label>Хот / Аймаг</label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistrict("");
                        setSelectedSubdistrict("");
                        setHasChanged(true);
                      }}
                    >
                      <option value="">Сонгох...</option>
                      {addressData && Object.keys(addressData).map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Дүүрэг / Сум</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setSelectedSubdistrict("");
                        setHasChanged(true);
                      }}
                      disabled={!selectedProvince}
                    >
                      <option value="">Сонгох...</option>
                      {selectedProvince &&
                        Object.keys(addressData[selectedProvince] || {}).map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Хороо / Баг</label>
                    <select
                      value={selectedSubdistrict}
                      onChange={(e) => {
                        setSelectedSubdistrict(e.target.value);
                        setHasChanged(true);
                      }}
                      disabled={!selectedDistrict}
                    >
                      <option value="">Сонгох...</option>
                      {selectedDistrict &&
                        (addressData[selectedProvince]?.[selectedDistrict] || []).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Таны бүртгэлтэй дугаар</label>
                    <input type="text" value={userPhone} readOnly className="readonly-phone" />
                  </div>
                  <div className="form-group">
                    <label>Нэмэлт холбоо барих дугаар</label>
                    <input
                      type="text"
                      name="alt_phone"
                      placeholder="Хэрвээ өөр хүн хүлээж авах бол..."
                      value={address.alt_phone || ""}
                      onChange={(e) => {
                        setAddress({ ...address, alt_phone: e.target.value });
                        setHasChanged(true);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Дэлгэрэнгүй хаяг</label>
                    <textarea
                      name="location"
                      placeholder="Байр, орц, давхар, тоот..."
                      value={address.location}
                      onChange={(e) => {
                        handleChange(e);
                        setHasChanged(true);
                      }}
                    ></textarea>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* === 3-р шат — Төлбөр === */}
        {step === 3 && (
  <div className="checkout-step-content">
    <div className="payment-card">
      <h2 className="payment-title">
        <FaCreditCard className="payment-icon" /> Төлбөрийн хэсэг
      </h2>

      <form className="payment-form">
    
     

        {/* КАРТ */}
        <label
          className={
            "payment-option" +
            (selectedPayment === "Карт" ? " active" : "")
          }
        >
          <input
            type="radio"
            name="payment"
            value="Карт"
            checked={selectedPayment === "Карт"}
            onChange={(e) => setSelectedPayment(e.target.value)}
          />
          <span className="option-icon card">
            <FaCreditCard />
          </span>
          <span className="option-label">Карт</span>
        </label>

        {/* БАНК */}
        <label
          className={
            "payment-option" +
            (selectedPayment === "Банк" ? " active" : "")
          }
        >
          <input
            type="radio"
            name="payment"
            value="Банк"
            checked={selectedPayment === "Банк"}
            onChange={(e) => setSelectedPayment(e.target.value)}
          />
          <span className="option-icon bank">
            <FaUniversity />
          </span>
          <span className="option-label">Банк</span>
        </label>
      </form>
    </div>
  </div>
)}

        </div>
        {/* === 4-р шат — Амжилттай === */}
        {step === 4 && (
          <div className="checkout-step-content success-step">
            <div className="success-container">
              <div className="success-circle">
                <i className="fa-solid fa-check success-icon"></i>
              </div>
              <h2>Амжилттай</h2>
              <p>Таны захиалга амжилттай хийгдлээ!</p>
              <button
                className="btn-home"
                onClick={() => {
                  setCart([]);
                  setStep(1);
                  navigate("/user/profile/orders");
                }}
              >
                Захиалга харах
              </button>
            </div>
          </div>
        )}
        {/* === Баруун тал === */}
        {step !== 4 && (
          <div className="cart-summary fixed-summary">
            <h3>Захиалгын мэдээлэл</h3>
            <div className="summary-items-list">
              {cart.length > 0 ? (
                cart.map((item) => {
                  const discounted =
                    item.discount_percent && item.discount_percent > 0;
                  const price = discounted
                    ? item.price * (1 - item.discount_percent / 100)
                    : item.price;
                  return (
                    <div key={item.cart_id} className="summary-item">
                      <div className="summary-item-info">
                        <span className="summary-item-name">{item.name}</span>
                        <span className="summary-item-qty">x{item.quantity}</span>
                      </div>
                      <span className="summary-item-price">
                        {price.toLocaleString()}₮
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="empty-summary">Сагс хоосон байна</p>
              )}
            </div>

            <div className="summary-total">
              <p>Нийт бараа: <strong>{totalItems} ширхэг</strong></p>
              <p>Нийт дүн: <strong>{totalPrice.toLocaleString()}₮</strong></p>
            </div>
            <div className="summary-buttons">
              <button
                className={`btn-next ${(step === 1 && cart.length === 0) || (step === 2 && !isAddressValid) || (step === 3 && !selectedPayment)
                  ? "disabled"
                  : ""
                  }`}
                disabled={
                  (step === 1 && cart.length === 0) || (step === 2 && !isAddressValid) || (step === 3 && !selectedPayment)
                }
                onClick={handleNextAction}
              >
                {getNextButtonText()}
              </button>
              <button
                className="btn-back-global"
                onClick={() => {
                  if (step > 1) setStep(step - 1);
                  else navigate(-1);
                }}
              >
                <i class="fa-solid fa-angle-left"></i>
                 Буцах
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
