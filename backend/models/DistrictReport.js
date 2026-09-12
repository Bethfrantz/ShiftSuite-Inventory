const mongoose = require("mongoose");

const DistrictReportSchema = new mongoose.Schema({
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "District",
    required: true,
  },

  districtName: String,

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
});

module.exports = mongoose.model("DistrictReport", DistrictReportSchema);
