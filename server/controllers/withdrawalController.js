const { Resignation, Withdrawal } = require("../models");
const logger = require("../logger");

const createWithdrawal = async (req, res) => {
  try {
    const { resignationId, reason } = req.body;

    if (!resignationId || !reason) {
      logger.warn("Withdrawal attempt with missing fields");
      return res.status(400).json({ 
        message: "Resignation ID and reason are required" 
      });
    }

    // Check if resignation exists and belongs to the user
    const resignation = await Resignation.findById(resignationId);
    if (!resignation) {
      logger.warn(`Withdrawal attempt for non-existing resignation ID: ${resignationId}`);
      return res.status(404).json({ 
        message: "Resignation not found" 
      });
    }

    if (resignation.username !== req.session.username) {
      logger.warn(`Unauthorized withdrawal attempt by ${req.session.username} for resignation ID: ${resignationId}`);
      return res.status(403).json({ 
        message: "You can only withdraw your own resignations" 
      });
    }

    if (resignation.status !== "pending") {
      logger.warn(`Withdrawal attempt for non-pending resignation ID: ${resignationId}, status: ${resignation.status}`);
      return res.status(400).json({ 
        message: "Can only withdraw pending resignations" 
      });
    }

    // Check if there's already a pending withdrawal for this resignation
    const existingWithdrawal = await Withdrawal.findOne({ 
      resignationId, 
      status: "pending" 
    });
    if (existingWithdrawal) {
      logger.warn(`Duplicate withdrawal attempt for resignation ID: ${resignationId}`);
      return res.status(400).json({ 
        message: "A withdrawal request is already pending for this resignation" 
      });
    }

    const withdrawal = new Withdrawal({
      resignationId,
      username: req.session.username,
      reason,
    });

    await withdrawal.save();
    logger.info(`Withdrawal request submitted by ${req.session.username} for resignation ID: ${resignationId}`);
    
    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal,
    });
  } catch (error) {
    logger.error(`Error submitting withdrawal request: ${error.message}`);
    res.status(500).json({
      message: "Error submitting withdrawal request",
      error: error.message,
    });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('resignationId')
      .sort({ submittedAt: -1 });
    logger.info("Fetched all withdrawal requests");
    res.json(withdrawals);
  } catch (error) {
    logger.error(`Error fetching withdrawal requests: ${error.message}`);
    res.status(500).json({
      message: "Error fetching withdrawal requests",
      error: error.message,
    });
  }
};

const getWithdrawalsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const withdrawals = await Withdrawal.find({ username })
      .populate('resignationId')
      .sort({ submittedAt: -1 });
    logger.info(`Fetched withdrawal requests for user: ${username}`);
    res.json(withdrawals);
  } catch (error) {
    logger.error(`Error fetching withdrawal requests for user ${req.params.username}: ${error.message}`);
    res.status(500).json({
      message: "Error fetching user withdrawal requests",
      error: error.message,
    });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      logger.warn(`Invalid withdrawal status update attempt for ID ${id}: ${status}`);
      return res.status(400).json({
        message: "Invalid status. Must be 'approved' or 'rejected'",
      });
    }

    const withdrawal = await Withdrawal.findById(id).populate('resignationId');
    if (!withdrawal) {
      logger.warn(`Withdrawal with ID ${id} not found for status update`);
      return res.status(404).json({
        message: "Withdrawal request not found",
      });
    }

    if (withdrawal.status !== "pending") {
      logger.warn(`Attempt to update non-pending withdrawal ID ${id}, current status: ${withdrawal.status}`);
      return res.status(400).json({
        message: "Can only update pending withdrawal requests",
      });
    }

    // Update withdrawal status
    withdrawal.status = status;
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = req.session.username;
    await withdrawal.save();

    // If withdrawal is approved, update resignation status to withdrawn
    if (status === "approved") {
      await Resignation.findByIdAndUpdate(
        withdrawal.resignationId._id,
        { status: "withdrawn" }
      );
      logger.info(`Resignation ID ${withdrawal.resignationId._id} marked as withdrawn`);
    }

    logger.info(`Withdrawal status updated for ID ${id} to ${status} by ${req.session.username}`);
    res.json({
      message: "Withdrawal status updated successfully",
      withdrawal,
    });
  } catch (error) {
    logger.error(`Error updating withdrawal status for ID ${req.params.id}: ${error.message}`);
    res.status(500).json({
      message: "Error updating withdrawal status",
      error: error.message,
    });
  }
};

module.exports = {
  createWithdrawal,
  getAllWithdrawals,
  getWithdrawalsByUser,
  updateWithdrawalStatus,
}; 