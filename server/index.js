const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const logger = require("./logger");

// Import routes
const { authRoutes, resignationRoutes, withdrawalRoutes } = require("./routes");

require("dotenv").config();
const connectToDB = require("./db");

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

// Routes
app.use("/api", authRoutes);
app.use("/api/resignations", resignationRoutes);
app.use("/api/withdrawals", withdrawalRoutes);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
