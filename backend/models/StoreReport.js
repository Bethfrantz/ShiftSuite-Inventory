const mongoose = require("mongoose");

const StoreReportSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  storeName: String,

  kpis: {
    type: Object,
    default: {},
  },

  forecast: {
    type: Object,
    default: {},
  },

  generatedAt: {
    type: Date,
    default: Date.now,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true, // Add index for tenantId
  },
});

module.exports = mongoose.model("StoreReport", StoreReportSchema);
