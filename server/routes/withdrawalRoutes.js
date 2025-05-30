const express = require("express");
const {
  createWithdrawal,
  getAllWithdrawals,
  getWithdrawalsByUser,
  updateWithdrawalStatus,
} = require("../controllers/withdrawalController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Withdrawal routes
router.post("/", requireAuth, createWithdrawal);
router.get("/", requireAuth, getAllWithdrawals);
router.get("/user/:username", requireAuth, getWithdrawalsByUser);
router.put("/:id/status", requireAuth, updateWithdrawalStatus);

module.exports = router; 