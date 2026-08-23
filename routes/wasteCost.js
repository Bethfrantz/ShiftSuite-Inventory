const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// Waste cost analysis
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    let rawWasteCost = [];
    let finishedWasteCost = [];
    let totalCost = 0;

    for (const w of wasteRecords) {
      // RAW WASTE COST
      if (w.type === "raw") {
        const item = w.rawItemId;
        const cost = item.currentPrice * w.quantity;

        rawWasteCost.push({
          itemId: item._id,
          name: item.name,
          quantity: w.quantity,
          unitPrice: item.currentPrice,
          cost,
          reason: w.reason,
          photoUrl: item.photoUrl,
        });

        totalCost += cost;
      }

      // FINISHED PRODUCT WASTE COST
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        let finishedCost = 0;

        const ingredientBreakdown = finished.ingredients.map((ing) => {
          const ingredientCost =
            ing.itemId.currentPrice * ing.quantityUsed * w.quantity;
          finishedCost += ingredientCost;

          return {
            itemId: ing.itemId._id,
            name: ing.itemId.name,
            quantityUsed: ing.quantityUsed * w.quantity,
            unitPrice: ing.itemId.currentPrice,
            cost: ingredientCost,
            photoUrl: ing.itemId.photoUrl,
          };
        });

        finishedWasteCost.push({
          finishedProductId: finished._id,
          name: finished.name,
          quantity: w.quantity,
          totalCost: finishedCost,
          reason: w.reason,
          photoUrl: finished.photoUrl,
          ingredients: ingredientBreakdown,
        });

        totalCost += finishedCost;
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      rawWasteCost,
      finishedWasteCost,
      totalCost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
