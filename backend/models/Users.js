const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["manager", "district", "corporate"],
      required: true,
    },

    tenantCode: {
      type: String,
      required: true, // "ELMOS"
    },

    storeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],

    activeStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
