import React from "react";

export default function Info() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
     <div>
        <h2>Хувийн мэдээлэл</h2>
        <form className="profile-form">
          <div className="form-row">
            <label>Хэрэглэгчийн нэр</label>
            <input type="text" value={user?.name || ""} readOnly />
          </div>

          <div className="form-row">
            <label>И-мэйл хаяг</label>
            <input type="text" value={user?.email || ""} readOnly />
          </div>

          <div className="form-row">
            <label>Утасны дугаар</label>
            <input type="text" value={user?.phone || ""} readOnly />
          </div>

          <h3>Гэрийн хаяг</h3>

          <div className="address-grid">
            <select>
              <option>Хот, аймаг</option>
            </select>
            <select>
              <option>Дүүрэг, сум</option>
            </select>
            <select>
              <option>Хороо, баг</option>
            </select>
          </div>

          <div className="form-row">
            <label>Дэлгэрэнгүй хаяг</label>
            <input type="text" placeholder="..." />
          </div>

          <button type="button" className="save-btn">
            Хадгалах
          </button>
        </form>
      </div>
  );
}
