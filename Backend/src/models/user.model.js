const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, "Username already exists"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Account already exists with this email address"],
  },
  password: {
    type: String,
    required: true,
  },
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
