const mongoose = require("mongoose");

const AdjustmentSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  quantityChange: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    enum: [
      "waste",
      "shrinkage",
      "damage",
      "transfer_out",
      "transfer_in",
      "correction",
      "recount",
    ],
    required: true,
  },

  notes: {
    type: String,
    default: "",
  },

  createdBy: {
    type: String,
    default: "system",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Adjustment", AdjustmentSchema);
