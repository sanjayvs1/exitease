const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const { Resignation, User } = require("./models");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const logger = require("./logger");

require("dotenv").config();
const connectToDB = require("./db");
const { log } = require("console");

connectToDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Create access log stream
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(morgan("combined", { stream: accessLogStream }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "6174",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/exitease",
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: "lax", // Helps with CORS
    },
  })
);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }
  next();
};

// Auth routes
app.post("/api/signup", async (req, res) => {
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
});

app.post("/api/login", async (req, res) => {
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
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout error" });
    }
    logger.info(`User logged out: ${req.session.username}`);
    res.json({ message: "Logout successful" });
  });
});

// Resignation routes
app.post("/api/resignations", requireAuth, async (req, res) => {
  try {
    const { name, department, lastWorkingDay, reason, additionalComments } =
      req.body;

    const resignation = new Resignation({
      name,
      department,
      lastWorkingDay,
      reason,
      additionalComments,
    });

    await resignation.save();
    logger.info(`Resignation submitted by ${name} in ${department}`);
    res.status(201).json({
      message: "Resignation submitted successfully",
      resignation,
    });
  } catch (error) {
    logger.error(
      `Error submitting resignation for ${req.body.name}: ${error.message}`
    );
    res.status(400).json({
      message: "Error submitting resignation",
      error: error.message,
    });
  }
});

app.get("/api/resignations", requireAuth, async (req, res) => {
  try {
    const resignations = await Resignation.find().sort({ submittedAt: -1 });
    logger.info("Fetched all resignations");
    res.json(resignations);
  } catch (error) {
    logger.error(`Error fetching resignations: ${error.message}`);
    res.status(500).json({
      message: "Error fetching resignations",
      error: error.message,
    });
  }
});

app.put("/api/resignations/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      logger.warn(
        `Invalid status update attempt for resignation ID ${id}: ${status}`
      );
      return res.status(400).json({
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
      });
    }

    const resignation = await Resignation.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!resignation) {
      logger.warn(`Resignation with ID ${id} not found for status update`);
      return res.status(404).json({
        message: "Resignation not found",
      });
    }
    logger.info(`Resignation status updated for ID ${id} to ${status}`);
    res.json({
      message: "Resignation status updated successfully",
      resignation,
    });
  } catch (error) {
    logger.error(
      `Error updating resignation status for ID ${req.params.id}: ${error.message}`
    );
    res.status(400).json({
      message: "Error updating resignation status",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
