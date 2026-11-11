const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true }, // NEW
    storeName: { type: String, required: true }, // NEW
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District" }, // NEW
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true, // Add index for tenantId
    },

    address: { type: String, default: "" },
    driveThruEnabled: { type: Boolean, default: false },
    driveThruLanes: { type: Number, default: 1 },

    orderingFrequency: {
      type: Map,
      of: Number,
      default: {},
    },

    location: {
      lat: Number,
      lng: Number,
    },

    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
StoreSchema.index({ tenantId: 1, storeId: 1 }, { unique: true });
StoreSchema.index({
  tenantId: 1,
  active: 1,
});

StoreSchema.index({
  tenantId: 1,
  districtId: 1,
});
module.exports = mongoose.model("Store", StoreSchema);
