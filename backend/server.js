const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const adminUploadRoutes = require("./routes/admin/adminUploadRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Connecting backend");
});

// Public хавтсанд хадгалагдсан зураг файлуудыг serve хийх
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

//  Routes бүртгэх
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/favorites", require("./routes/favoriteRoutes"));

app.use("/api/admin/upload", adminUploadRoutes);
app.use("/uploads", express.static("uploads"));

//  Сервер асаах
if (require.main === module) {
  const PORT = process.env.PORT || 5050;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
