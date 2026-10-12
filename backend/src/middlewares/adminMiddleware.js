const adminOnly = (req, res, next) => {
  // authMiddleware should run before this middleware
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Check user's role
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false, 
      message: "Admin access required",
    });
  }

  next();
};

module.exports = adminOnly; 
