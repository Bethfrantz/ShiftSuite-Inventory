const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const FinishedProduct = require("../models/FinishedProduct");

// STORE DEMAND FORECASTING
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    // Load last 30 days of usage
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    const forecast = {};

    // Initialize entries
    for (const fp of finishedProducts) {
      forecast[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        usage7: 0,
        usage14: 0,
        usage30: 0,
        movingAverage: 0,
        trendFactor: 1,
        forecastNext7Days: 0,
      };
    }

    // Aggregate usage
    for (const u of usageRecords) {
      const item = u.itemId;
      const daysAgo =
        (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (!ingredient) continue;

        const fpEntry = forecast[fp._id];
        const fpUnits = u.quantity / ingredient.quantityUsed;

        if (daysAgo <= 7) fpEntry.usage7 += fpUnits;
        if (daysAgo <= 14) fpEntry.usage14 += fpUnits;
        fpEntry.usage30 += fpUnits;
      }
    }

    // Calculate moving average + trend
    for (const id in forecast) {
      const fp = forecast[id];

      const avg7 = fp.usage7 / 7;
      const avg14 = fp.usage14 / 14;
      const avg30 = fp.usage30 / 30;

      // Moving average (weighted)
      fp.movingAverage = Number(
        (avg7 * 0.5 + avg14 * 0.3 + avg30 * 0.2).toFixed(2),
      );

      // Trend factor
      if (avg7 > avg14)
        fp.trendFactor = 1.15; // rising demand
      else if (avg7 < avg14)
        fp.trendFactor = 0.9; // falling demand
      else fp.trendFactor = 1.0; // stable

      // Forecast next 7 days
      fp.forecastNext7Days = Number(
        (fp.movingAverage * fp.trendFactor * 7).toFixed(2),
      );
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      demandForecast: forecast,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
