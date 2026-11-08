const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserModel
 * @description Register a new user, expects a request body with username,email,password and saves the user to the database.
 * @route POST /api/auth/register
 * @access public
 *
 */

async function registerUserController(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(404).json({
      message: "Please provide username,email and password",
    });
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "User already exists with this email address or username",
    });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username,
    email,
    password: hash,
  });
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  res.cookie("token", token);

  res.status(201).json({
    message: "User registerd successfully",
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
    },
  });
}

/**
 * @name loginUserController
 * @description login a user and expects mail and password in req.body
 * @access public
 */

async function loginUserController(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid password",
    });
  }

  const token = await jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
  res.cookie("token", token);

  res.status(200).json({
    message: "User logged in successfully..",
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
    },
  });
}

/**
 * @route GET /api/auth/logout
 * @description logout the user by clearing cookie and blacklisting token
 * @access public
 */

async function logoutUserController(req, res) {
  const token = req.cookies.token;
  if (token) {
    await tokenBlacklistModel.create({ token });
  }
  res.clearCookie("token");
  res.status(200).json({
    message: "User logged out successfully..",
  });
}

/**
 * @route GET /api/auth/get-me
 * @description addgets the user details through token
 * @access private
 */

async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id);

  res.status(200).json({
    message: "User details fetched successfully..",
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
    },
  });
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
