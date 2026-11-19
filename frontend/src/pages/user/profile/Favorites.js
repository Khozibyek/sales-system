import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // ✅ navigate нэмсэн

export default function Favorites() {
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate(); // ✅ navigate ашиглах
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/favorites/user/${userId}`)
      .then((res) => setFavorites(res.data))
      .catch((err) => console.error("Дуртай бараа татах алдаа:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRemoveFavorite = async (productId) => {
    try {
      await axios.post("/api/favorites/toggle", {
        user_id: userId,
        product_id: productId,
      });
      setFavorites((prev) => prev.filter((item) => item.id !== productId));
      toast.info("Дуртай бараанаас хасагдлаа");
    } catch (err) {
      console.error("Remove favorite error:", err);
      toast.error("Хасах үед алдаа гарлаа");
    }
  };

  if (!userId) return <p>Нэвтэрч орно уу.</p>;
  if (loading) return <p>Уншиж байна...</p>;

  return (
  <div className="favorites-page">
    <div className="favorites-header">
      <h2 className="favorites-title">Миний дуртай бараанууд</h2>
    </div>

    {favorites.length === 0 ? (
      <p className="no-fav-text">Та одоогоор дуртай бараа нэмээгүй байна.</p>
    ) : (
      <div className="favorites-grid">
        {favorites.map((item) => (
          <div key={item.id} className="favorite-card">
            <div className="fav-img-wrap">
              {item.main_image ? (
                <img
                  src={`/${item.main_image.replace(/^\/+/, "")}`}
                  alt={item.name}
                  className="fav-img"
                  onClick={() => navigate(`/user/product/${item.id}`)}
                />
              ) : (
                <div className="no-img">No Image</div>
              )}
              <button
                className="remove-fav"
                onClick={() => handleRemoveFavorite(item.id)}
                title="Хасах"
              >
                ×
              </button>
            </div>

            <div className="fav-info">
              <h4 onClick={() => navigate(`/user/product/${item.id}`)}>
                {item.name}
              </h4>
              <p>{Number(item.price).toLocaleString()} ₮</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

}
