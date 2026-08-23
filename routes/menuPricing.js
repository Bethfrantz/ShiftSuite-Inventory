const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// MENU PRICING RECOMMENDATIONS
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
        costPerUnit,
        usage: 0,
        wasteUnits: 0,
        wasteCost: 0,
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
          fpEntry.usage += u.quantity / ingredient.quantityUsed;
        }
      }
    }

    // WASTE IMPACT
    for (const w of wasteRecords) {
      // Finished product waste
      if (w.type === "finished") {
        const fpEntry = pricing[w.finishedProductId._id];
        fpEntry.wasteUnits += w.quantity;
        fpEntry.wasteCost += fpEntry.costPerUnit * w.quantity;
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
            fpEntry.wasteUnits += quantityUsed;
            fpEntry.wasteCost += w.quantity * item.currentPrice;
          }
        }
      }
    }

    // PRICING RECOMMENDATION
    for (const id in pricing) {
      const fp = pricing[id];

      const effectiveCost = fp.costPerUnit + fp.wasteCost;

      // Determine margin tier
      let margin;
      if (fp.costPerUnit < 1.0)
        margin = 4.0; // 400%
      else if (fp.costPerUnit < 2.5)
        margin = 3.0; // 300%
      else if (fp.costPerUnit < 4.0)
        margin = 2.5; // 250%
      else margin = 2.0; // 200%

      // Adjust margin based on usage & waste
      const usageFactor = fp.usage > 100 ? 0.9 : fp.usage > 50 ? 1.0 : 1.1;
      const wasteFactor =
        fp.wasteUnits > 10 ? 1.2 : fp.wasteUnits > 5 ? 1.1 : 1.0;

      const finalMargin = margin * usageFactor * wasteFactor;

      fp.recommendedPrice = Number((effectiveCost * finalMargin).toFixed(2));
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      pricingRecommendations: pricing,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
