const mongoose = require("mongoose");
const bCrypt = require("bcryptjs");
const Schema = mongoose.Schema;
const gravatar = require("gravatar");

const userSchema = new Schema({
  name: {
    type: String,
    default: "Guest",
  },
  password: {
    type: String,
    required: [true, "Set password for user"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  avatar: {
    type: String,
    default: function () {
      return gravatar.url(this.email, { s: "250" }, true);
    },
  },
  token: String,
});

// userSchema.methods.setPassword = function (password) {
//   this.password = bCrypt.hashSync(password, bCrypt.genSaltSync(6));
// };

userSchema.methods.validPassword = async function (password) {
  return bCrypt.compareSync(password, this.password);
};

const User = mongoose.model("user", userSchema);

module.exports = {
  User,
};
