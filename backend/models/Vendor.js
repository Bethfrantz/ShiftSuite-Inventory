const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    notes: { type: String, default: "" },
    active: { type: Boolean, default: true },
    deliveryDays: { type: String, default: [] },
    leadTimeDays: { type: Number, default: 0 },
    contactEmail: { type: String, default: "" },
    contractNotes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vendor", VendorSchema);
