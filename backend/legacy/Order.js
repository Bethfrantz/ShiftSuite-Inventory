const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
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
            vendor: String, // you are using vendor names for now
            par: Number,
            currentQuantity: Number,
            orderQuantity: Number
        }
    ],

    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
