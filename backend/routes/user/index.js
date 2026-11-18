// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    profileUser
} = require("../../controllers/user/userController");

//  POST /user/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", profileUser);
// router.post("/home", homeUser);

module.exports = router;
