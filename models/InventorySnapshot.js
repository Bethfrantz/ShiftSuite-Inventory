const mongoose = require("mongoose");

const InventorySnapshotSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },

    items: [
        {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],

    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("InventorySnapshot", InventorySnapshotSchema);
