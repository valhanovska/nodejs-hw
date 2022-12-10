const { User } = require("../service/schemas/users");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const passport = require("passport");
const secret = process.env.SECRET;
const gravatar = require("gravatar/lib/gravatar");
const fs = require("fs/promises");
const bCrypt = require("bcryptjs");
const path = require("path");
const Jimp = require("jimp");
const sgMail = require("@sendgrid/mail");
const { v4: uuidv4 } = require("uuid");
const emailFrom = process.env.SENDGRID_EMAIL_FROM;

const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.findOne({ email });
  const verificationToken = uuidv4();

  if (user) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Email is already in use",
      data: "Conflict",
    });
  }
  try {
    const hashedPassword = await bCrypt.hash(password, 15);
    const avatarURL = gravatar.url(email);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: avatarURL,
      verificationToken,
    });

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email,
      from: emailFrom,
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: `<a href="http://localhost:3000/api/users/verify/${verificationToken}">Confirm</>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    const token = jwt.sign({ _id: newUser._id }, secret, {
      expiresIn: "10h",
    });

    await User.findByIdAndUpdate(
      { _id: newUser._id },
      { token },
      { new: true }
    );

    return res.status(201).json({
      status: "success",
      code: 201,
      data: {
        message: "Registration successful",
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        token: token,
        avatar: avatarURL,
      },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.validPassword(password)) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Incorrect Login or password",
      data: "Bad request",
    });
  }

  const payload = {
    id: user.id,
    username: user.username,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: "5h",
  });

  if (!user.verify) {
    const msg = {
      to: email,
      from: emailFrom,
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: `<a href="http://localhost:3000/api/users/verify/${user.verificationToken}">Confirm</>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    return res.status(401).json({
      message: "mail not verified",
    });
  }

  return res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const logout = async (req, res, next) => {
  const id = req.user._id;
  await User.updateOne({ _id: id }, { token: null });
  return res.status(204).json({ messange: "No Content" });
};

const current = async (req, res, next) => {
  const { name, email, subscription } = req.user;
  res.status(200).json({
    status: "success",
    code: 200,
    data: {
      message: `Authorization was successful: ${name}`,
      email: email,
      subscription: subscription,
    },
  });
};

const updateAvatar = async (req, res) => {
  const avatarsPath = path.join(__dirname, "../", "public", "avatars");
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const fileName = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsPath, fileName);
  await fs.rename(tempUpload, resultUpload);
  const resizeImage = await Jimp.read(resultUpload);
  resizeImage.resize(250, 250).write(resultUpload);
  const avatarURL = path.join("avatars", fileName);
  await User.updateOne({ _id }, { avatar: avatarURL });
  res.json({
    avatarURL,
  });
};

const isTokenVerification = async (req, res, next) => {
  const user = await User.findOne({
    verificationToken: req.params.verificationToken,
  });

  if (user) {
    await User.updateOne(
      { _id: user._id },
      { verify: true, verificationToken: null }
    );

    return res.status(200).json({
      status: "success",
      code: 200,
      data: {
        message: "Verification successful!",
      },
    });
  }
  return res.status(404).json({
    status: "error",
    code: 404,
    message: "User not found",
  });
};

const isUserVerify = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Incorrect Login or password",
      data: "Bad request",
    });
  }

  if (!user.verify) {
    const msg = {
      to: email,
      from: emailFrom,
      subject: "Sending with SendGrid is Fun",
      text: "and easy to do anywhere, even with Node.js",
      html: `<a href="http://localhost:3000/api/users/verify/${user.verificationToken}">Confirm</>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    return res.status(200).json({
      message: "Verification email sent",
    });
  }

  return res.status(400).json({
    message: "Verification has already been passed",
  });
};

module.exports = {
  register,
  login,
  logout,
  current,
  auth,
  updateAvatar,
  isTokenVerification,
  isUserVerify,
};
