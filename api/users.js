const express = require("express");

const router = express.Router();

const {
  register,
  login,
  logout,
  current,
  auth,
  updateAvatar,
  isTokenVerification,
  isUserVerify,
} = require("../controller/users");
const upload = require("../middleware/uploadImages");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", auth, logout);
router.get("/current", auth, current);
router.patch("/avatars", auth, upload.single("avatars"), updateAvatar);
router.get("/verify/:verificationToken", isTokenVerification);
router.post("/verify", isUserVerify);

module.exports = router;
