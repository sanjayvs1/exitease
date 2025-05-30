// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }
  next();
};

module.exports = {
  requireAuth,
}; 