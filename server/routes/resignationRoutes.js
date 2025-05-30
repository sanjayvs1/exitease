const express = require("express");
const {
  createResignation,
  getAllResignations,
  getResignationsByUser,
  updateResignationStatus,
} = require("../controllers/resignationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Resignation routes
router.post("/", requireAuth, createResignation);
router.get("/", requireAuth, getAllResignations);
router.get("/user/:username", requireAuth, getResignationsByUser);
router.put("/:id/status", requireAuth, updateResignationStatus);

module.exports = router; 