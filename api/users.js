const express = require("express");

const router = express.Router();

const {
  register,
  login,
  logout,
  current,
  auth,
} = require("../controller/users");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", auth, logout);
router.get("/current", auth, current);

module.exports = router;
