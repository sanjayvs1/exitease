const { Resignation } = require("../models");
const logger = require("../logger");

const createResignation = async (req, res) => {
  try {
    const { username, name, department, lastWorkingDay, reason, additionalComments } =
      req.body;

    const resignation = new Resignation({
      username: req.session.username || username,
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
};

const getAllResignations = async (req, res) => {
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
};

const getResignationsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const resignations = await Resignation.find({ username }).sort({ submittedAt: -1 });
    logger.info(`Fetched resignations for user: ${username}`);
    res.json(resignations);
  } catch (error) {
    logger.error(`Error fetching resignations for user ${req.params.username}: ${error.message}`);
    res.status(500).json({
      message: "Error fetching user resignations",
      error: error.message,
    });
  }
};

const updateResignationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved"].includes(status)) {
      logger.warn(
        `Invalid status update attempt for resignation ID ${id}: ${status}`
      );
      return res.status(400).json({
        message: "Invalid status. Only 'approved' status is allowed",
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
};

module.exports = {
  createResignation,
  getAllResignations,
  getResignationsByUser,
  updateResignationStatus,
}; 