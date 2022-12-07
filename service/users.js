const { Users } = require("../service/schemas/users");
// const { createError } = require("../helpers/errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createError = (status, message) => {
  return {
    status,
    message,
  };
};

const registerUser = async (userData) => {
  const result = await Users.findOne({ email: userData.email });
  if (result) {
    throw createError(409, "Email in use");
  }
  const password = userData.password;
  const hashedPassword = await bcrypt.hash(password, 10);

  return Users.create({
    ...userData,
    password: hashedPassword,
  });
};

const loginUser = async ({ email, password }) => {
  const user = await Users.findOne({ email });
  if (!user) {
    throw createError(401, "Login or password is wrong");
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw createError(401, "Login or password is wrong");
  }
  const payload = {
    id: user._id,
    subscription: user.subscription,
  };
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1h" });
  await Users.findByIdAndUpdate(user._id, { token });
  return {
    token,
  };
};

const logoutUser = async (_id) => {
  await Users.findByIdAndUpdate(_id, { token: null });
};

const authenticateUser = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.SECRET);
    const { id } = payload;
    const user = await Users.findById(id);

    return user.token !== token ? null : user;
  } catch (e) {
    return null;
  }
};

module.exports = {
  registerUser,
  loginUser,
  authenticateUser,
  logoutUser,
};
