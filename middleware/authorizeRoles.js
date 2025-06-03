function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userRole = req.user.roles;
    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ message: `Access denied for role: ${userRole}` });
    }

    next();
  };
}
module.exports = authorizeRoles;
