const { AsyncLocalStorage } = require("async_hooks");

// A single instance to share across middleware and Mongoose
const tenantStorage = new AsyncLocalStorage();

module.exports = {
  tenantStorage,
  // Helper to quickly grab the active tenant ID
  getTenantId: () => tenantStorage.getStore()?.tenantId,
};
