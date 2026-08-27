const mongoose = require("mongoose");

const ItemUnitsSchema = new mongoose.Schema({
  caseSize: Number,
  bagSize: Number,
  cambroSize: Number,
  allowCambros: Boolean,
  allowSingles: Boolean,
});

const ItemSchema = new mongoose.Schema({
  name: String,
  vendor: String,

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  barcode: {
    type: String,
    required: false,
    unique: true, //optional but recommended
  },

  photoUrl: String,
  units: ItemUnitsSchema,

  parLevels: [
    {
      storeId: mongoose.Schema.Types.ObjectId,
      storeName: String,
      par: Number,
    },
  ],

  // ✔ UPDATED FIELD
  currentPrice: { type: Number, required: true },

  priceHistory: [],

  vendorItemNumber: String,
  active: Boolean,
});

module.exports = mongoose.model("Item", ItemSchema);
