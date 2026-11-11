const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    tenantCode: {
      type: String,
      required: true, // "ELMOS"
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "PlatformAdmin",
        "CompanyAdmin",
        "DistrictManager",
        "StoreManager",
        "Employee",
      ],
      required: true,
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

module.exports = mongoose.model("Tenant", TenantSchema);
