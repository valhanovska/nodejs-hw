const jwt = require("jsonwebtoken");
require("dotenv").config();
const { User } = require("../service/schemas/users");
const passport = require("passport");
const secret = process.env.SECRET;

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

//   const { name, email, password } = req.body;
//   const user = await Users.findOne({ email });

//   if (user) {
//     return res.status(409).json({
//       status: "error",
//       code: 409,
//       message: "Email is already in use",
//       data: "Conflict",
//     });
//   }
//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await Users.create({
//       name,
//       email,
//       password: hashedPassword,
//     });
//     console.log(newUser);

//     const token = jwt.sign({ _id: newUser._id }, secret, {
//       expiresIn: "10h",
//     });

//     await Users.findByIdAndUpdate(
//       { _id: newUser._id },
//       { token },
//       { new: true }
//     );

//     return res.status(201).json({
//       status: "success",
//       code: 201,
//       data: {
//         message: "Registration successful",
//         id: newUser.id,
//         name: newUser.name,
//         email: newUser.email,
//         token: token,
//       },
//     });
//   } catch (e) {
//     next(e);
//   }
// };

const register = async (req, res, next) => {
  const { username, email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Email is already in use",
      data: "Conflict",
    });
  }
  try {
    const newUser = new User({ username, email });
    newUser.setPassword(password);
    await newUser.save();
    res.status(201).json({
      status: "success",
      code: 201,
      data: {
        message: "Registration successful",
      },
    });
  } catch (error) {
    next(error);
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
  const { username, email, subscription } = req.user;
  res.status(200).json({
    status: "success",
    code: 200,
    data: {
      message: `Authorization was successful: ${username}`,
      email: email,
      subscription: subscription,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  current,
  auth,
};
