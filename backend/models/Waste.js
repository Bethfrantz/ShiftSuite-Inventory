const mongoose = require("mongoose");

const WasteSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    type: {
      type: String,
      enum: ["raw", "finished"],
      required: true,
    },

    rawItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },

    finishedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedProduct",
    },

    quantity: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      default: "Unspecified",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true, // Add index for tenantId
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Waste", WasteSchema);
