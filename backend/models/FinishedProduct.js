const mongoose = require("mongoose");

const FinishedProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    photoUrl: { type: String, default: "" },

    ingredients: [
        {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item",
                required: true
            },
            quantityUsed: {
                type: Number,
                required: true
            }
        }
    ],

    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("FinishedProduct", FinishedProductSchema);
