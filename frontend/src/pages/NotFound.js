import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1>404</h1>
      <h2>Хуудас олдсонгүй</h2>
      <button onClick={() => navigate("/user/home")}>
        Нүүр хуудас руу буцах
      </button>
    </div>
  );
}
