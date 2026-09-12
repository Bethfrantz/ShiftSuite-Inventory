const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },

  vendorItemNumber: {
    type: String,
    default: "",
  },

  quantity: {
    type: Number,
    required: true,
  },

  unitCost: {
    type: Number,
    required: true,
  },

  totalCost: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  invoiceNumber: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  items: [InvoiceItemSchema],

  subtotal: {
    type: Number,
    required: true,
  },

  tax: {
    type: Number,
    default: 0,
  },

  total: {
    type: Number,
    required: true,
  },

  received: {
    type: Boolean,
    default: false,
  },

  receivedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
