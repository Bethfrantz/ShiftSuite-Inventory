const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true, // Add index for tenantId
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", CategorySchema);
