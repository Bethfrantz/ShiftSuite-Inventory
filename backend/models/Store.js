const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    storeNumber: { type: Number, required: true },
    address: { type: String, default: "" },
    driveThruEnabled: { type: Boolean, default: false },
    driveThruLanes: { type: Number, default: 1 },

    orderingFrequency: {
      type: Map,
      of: Number, // e.g., { "Gordon": 2, "Sofo": 1 }
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
