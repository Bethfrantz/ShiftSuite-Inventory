const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const FinishedProduct = require("../models/FinishedProduct");
const Usage = require("../models/Usage");

// STORE STAFFING RECOMMENDATIONS
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Load finished products
    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    // Load last 14 days of usage
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    // Time buckets
    const buckets = {
      morning: { label: "Morning (6–10 AM)", demand: 0 },
      midday: { label: "Midday (11 AM–2 PM)", demand: 0 },
      evening: { label: "Evening (4–7 PM)", demand: 0 },
    };

    // Map usage into time buckets
    for (const u of usageRecords) {
      const hour = u.createdAt.getHours();
      const item = u.itemId;

      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (!ingredient) continue;

        const fpUnits = u.quantity / ingredient.quantityUsed;

        if (hour >= 6 && hour <= 10) buckets.morning.demand += fpUnits;
        else if (hour >= 11 && hour <= 14) buckets.midday.demand += fpUnits;
        else if (hour >= 16 && hour <= 19) buckets.evening.demand += fpUnits;
      }
    }

    // Staffing logic
    const staffing = {};

    for (const key in buckets) {
      const bucket = buckets[key];

      const demand = bucket.demand;

      // Base staffing formula
      const prepStaff = demand > 150 ? 3 : demand > 80 ? 2 : 1;
      const lineStaff =
        demand > 200 ? 4 : demand > 120 ? 3 : demand > 60 ? 2 : 1;
      const serviceStaff = demand > 180 ? 3 : demand > 100 ? 2 : 1;

      staffing[key] = {
        timeBlock: bucket.label,
        demand,
        recommendedStaff: {
          prep: prepStaff,
          line: lineStaff,
          service: serviceStaff,
          total: prepStaff + lineStaff + serviceStaff,
        },
      };
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      staffingRecommendations: staffing,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
