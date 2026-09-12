const mongoose = require("mongoose");

const ItemUnitsSchema = new mongoose.Schema({
  caseSize: Number,
  bagSize: Number,
  cambroSize: Number,
  allowCambros: Boolean,
  allowSingles: Boolean,
});

const PriceHistorySchema = new mongoose.Schema({
  price: Number,
  date: Date,
  invoiceId: mongoose.Schema.Types.ObjectId,
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vendor: { type: String, default: "" },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  barcode: {
    type: String,
    required: false,
    unique: true,
  },

  photoUrl: { type: String, default: "" },

  units: ItemUnitsSchema,

  parLevels: [
    {
      storeId: mongoose.Schema.Types.ObjectId,
      storeName: String,
      par: Number,
    },
  ],

  currentPrice: { type: Number, required: true },

  priceHistory: [PriceHistorySchema],

  vendorItemNumber: { type: String, default: "" },

  active: { type: Boolean, default: true },
});

module.exports = mongoose.model("Item", ItemSchema);
