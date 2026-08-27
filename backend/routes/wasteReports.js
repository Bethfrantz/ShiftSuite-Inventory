const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// Waste report for a store
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Optional date filtering
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    // Get store info
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Get waste records
    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    const rawWaste = [];
    const finishedWaste = [];

    for (const w of wasteRecords) {
      if (w.type === "raw") {
        rawWaste.push({
          itemId: w.rawItemId._id,
          name: w.rawItemId.name,
          quantity: w.quantity,
          reason: w.reason,
          photoUrl: w.rawItemId.photoUrl,
        });
      }

      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        finishedWaste.push({
          finishedProductId: finished._id,
          name: finished.name,
          quantity: w.quantity,
          reason: w.reason,
          photoUrl: finished.photoUrl,
          ingredients: finished.ingredients.map((ing) => ({
            itemId: ing.itemId._id,
            name: ing.itemId.name,
            quantityUsed: ing.quantityUsed * w.quantity,
            photoUrl: ing.itemId.photoUrl,
          })),
        });
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      rawWaste,
      finishedWaste,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
