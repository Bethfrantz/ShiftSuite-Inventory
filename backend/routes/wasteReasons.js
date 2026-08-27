const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// Waste reasons dashboard
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

    const reasons = {}; // reason → { count, cost }

    for (const w of wasteRecords) {
      const reason = w.reason || "Unspecified";

      if (!reasons[reason]) {
        reasons[reason] = {
          count: 0,
          cost: 0,
          rawItems: [],
          finishedProducts: [],
        };
      }

      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const cost = item.currentPrice * w.quantity;

        reasons[reason].count += w.quantity;
        reasons[reason].cost += cost;

        reasons[reason].rawItems.push({
          itemId: item._id,
          name: item.name,
          quantity: w.quantity,
          unitPrice: item.currentPrice,
          cost,
          photoUrl: item.photoUrl,
        });
      }

      // FINISHED PRODUCT WASTE
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

        reasons[reason].count += w.quantity;
        reasons[reason].cost += finishedCost;

        reasons[reason].finishedProducts.push({
          finishedProductId: finished._id,
          name: finished.name,
          quantity: w.quantity,
          totalCost: finishedCost,
          photoUrl: finished.photoUrl,
          ingredients: ingredientBreakdown,
        });
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      reasons,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
