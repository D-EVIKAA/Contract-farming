// Restricts a route to specific roles.
// Usage example: router.post("/", protect, authorizeRoles("buyer"), createContract);
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, please log in" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action is only allowed for: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
