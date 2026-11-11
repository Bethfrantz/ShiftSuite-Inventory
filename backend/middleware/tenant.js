function requireTenant(req, res, next) {
  if (!req.user?.tenantId) {
    return res.status(401).json({
      error: "Tenant required",
    });
  }

  req.tenantId = req.user.tenantId;

  next();
}

module.exports = requireTenant;
