const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    notes: { type: String, default: "" },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Vendor", VendorSchema);
