const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user/auth", require("./routes/user/authRoutes"));

app.get("/", (req, res) => {
  res.send("Connecting backend");
});

module.exports = app;
