const { tenantStorage } = require("./tenantContext");

function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;

  tenantStorage.run(
    {
      tenantId,
    },
    () => next(),
  );
}

module.exports = tenantMiddleware;
