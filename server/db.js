// db.js
const mongoose = require("mongoose");
require("dotenv").config();
const logger = require("./logger"); 

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose
      .connect(process.env.MONGODB_URI, {})
      .then(() => logger.info("MongoDB connected successfully"))
      .catch((err) => console.error("MongoDB connection error:", err));
  }
};

module.exports = connectToDB;
