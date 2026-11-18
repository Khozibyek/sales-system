import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/user/sidebar.css";

export default function Sidebar({ categoryName, brands = [], onBrandClick }) {
  const navigate = useNavigate();
  const { id, brandName } = useParams();

  const handleBrandClick = (b) => {
    if(brandName === b) {
      if(onBrandClick) onBrandClick(b, true);
      return;
    }
    if (onBrandClick) onBrandClick(b);
    navigate(`/user/category/${id}/brand/${encodeURIComponent(b)}`);
  };

  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">{categoryName}</h3>

      {brands.length > 0 && (
        <ul className="brand-list">
          {brands.map((b, i) => (
            <li key={i}>
              <a
                onClick={() => handleBrandClick(b)}
                className={brandName === b ? "active" : ""}
                style={{ cursor: "pointer" }}
              >
                {b}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
