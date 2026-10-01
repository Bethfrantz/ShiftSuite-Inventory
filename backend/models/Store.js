const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true }, // NEW
    storeName: { type: String, required: true }, // NEW
    districtId: { type: String, default: "Main" }, // NEW

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

module.exports = mongoose.model("Store", StoreSchema);
