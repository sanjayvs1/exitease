const mongoose = require('mongoose');

// Resignation model
const resignationSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  lastWorkingDay: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  additionalComments: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "withdrawn"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Withdrawal model
const withdrawalSchema = new mongoose.Schema({
  resignationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resignation',
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: String,
    trim: true,
  },
});

// User model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["HR", "employee"],
        required: true,
    },
});

const User = mongoose.model("User", userSchema);
const Resignation = mongoose.model("Resignation", resignationSchema);
const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

module.exports = { User, Resignation, Withdrawal };