const bcrypt = require("bcrypt");
const { User } = require("../models");
const logger = require("../logger");

const signup = async (req, res) => {
  try {
    const { username, password, role = "employee" } = req.body;

    if (!username || !password) {
      logger.warn("Signup attempt with missing fields");
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      logger.warn(`Signup attempt with existing username: ${username}`);
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role,
    });

    await user.save();
    logger.info(`New user created: ${username}`);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    logger.error(`Signup error for username ${req.body.username}: ${error.message}`);
    res.status(500).json({ message: "Signup error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logger.warn("Login attempt with missing fields");
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`Login attempt with non-existing username: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn(
        `Login attempt with invalid password for username: ${username}`
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    logger.info(`User logged in: ${username}`);
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Login error for username ${req.body.username}: ${error.message}`);
    res.status(500).json({ message: "Login error", error: error.message });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout error" });
    }
    logger.info(`User logged out: ${req.session.username}`);
    res.json({ message: "Logout successful" });
  });
};

module.exports = {
  signup,
  login,
  logout,
}; 