const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// STORE-SPECIFIC PRICING
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

    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate("itemId");

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    const pricing = {};

    // Initialize entries
    for (const fp of finishedProducts) {
      const costPerUnit = fp.ingredients.reduce((sum, ing) => {
        return sum + ing.itemId.currentPrice * ing.quantityUsed;
      }, 0);

      pricing[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        baseCostPerUnit: costPerUnit,
        storeUsage: 0,
        storeWasteUnits: 0,
        storeWasteCost: 0,
        demandScore: 0,
        recommendedPrice: 0,
      };
    }

    // USAGE IMPACT
    for (const u of usageRecords) {
      const item = u.itemId;

      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (ingredient) {
          const fpEntry = pricing[fp._id];
          fpEntry.storeUsage += u.quantity / ingredient.quantityUsed;
        }
      }
    }

    // WASTE IMPACT
    for (const w of wasteRecords) {
      // Finished product waste
      if (w.type === "finished") {
        const fpEntry = pricing[w.finishedProductId._id];
        fpEntry.storeWasteUnits += w.quantity;
        fpEntry.storeWasteCost += fpEntry.baseCostPerUnit * w.quantity;
      }

      // Raw waste affecting finished products
      if (w.type === "raw") {
        const item = w.rawItemId;

        for (const fp of finishedProducts) {
          const ingredient = fp.ingredients.find(
            (ing) => ing.itemId._id.toString() === item._id.toString(),
          );

          if (ingredient) {
            const fpEntry = pricing[fp._id];
            const quantityUsed = w.quantity / ingredient.quantityUsed;
            fpEntry.storeWasteUnits += quantityUsed;
            fpEntry.storeWasteCost += w.quantity * item.currentPrice;
          }
        }
      }
    }

    // DEMAND SCORE (simple version)
    for (const id in pricing) {
      const fp = pricing[id];

      if (fp.storeUsage > 120) fp.demandScore = 1.2;
      else if (fp.storeUsage > 80) fp.demandScore = 1.1;
      else if (fp.storeUsage > 40) fp.demandScore = 1.0;
      else fp.demandScore = 0.9;
    }

    // FINAL STORE-SPECIFIC PRICE
    for (const id in pricing) {
      const fp = pricing[id];

      const effectiveCost = fp.baseCostPerUnit + fp.storeWasteCost;

      // Margin tiers
      let margin;
      if (fp.baseCostPerUnit < 1.0) margin = 4.0;
      else if (fp.baseCostPerUnit < 2.5) margin = 3.0;
      else if (fp.baseCostPerUnit < 4.0) margin = 2.5;
      else margin = 2.0;

      // Adjust margin by demand & waste
      const wasteFactor =
        fp.storeWasteUnits > 10 ? 1.2 : fp.storeWasteUnits > 5 ? 1.1 : 1.0;
      const finalMargin = margin * fp.demandScore * wasteFactor;

      fp.recommendedPrice = Number((effectiveCost * finalMargin).toFixed(2));
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      storeSpecificPricing: pricing,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
