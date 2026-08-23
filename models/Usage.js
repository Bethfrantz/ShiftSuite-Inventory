const mongoose = require("mongoose");

const UsageSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },

    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    // NEW: supports drive-thru, mobile, kiosk, instore
    orderSource: {
        type: String,
        enum: ["instore", "driveThru", "mobile", "kiosk"],
        default: "instore"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Usage", UsageSchema);
