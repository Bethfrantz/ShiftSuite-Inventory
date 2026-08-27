const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const InventoryCount = require("../models/InventoryCount");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");
const Usage = require("../models/Usage");

// BATCH PREP SCHEDULING
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Load finished products
    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    // Load inventory
    const inventory = await InventoryCount.find({ storeId });

    // Load last 30 days of usage for forecasting
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    const schedule = {};

    // Initialize entries
    for (const fp of finishedProducts) {
      schedule[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        forecastNext7Days: 0,
        currentInventoryUnits: 0,
        requiredPrepUnits: 0,
        recommendedPrepTimes: [],
        ingredients: [],
      };
    }

    // FORECAST DEMAND (same logic as demand forecasting)
    for (const u of usageRecords) {
      const item = u.itemId;
      const daysAgo =
        (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (!ingredient) continue;

        const fpEntry = schedule[fp._id];
        const fpUnits = u.quantity / ingredient.quantityUsed;

        if (daysAgo <= 7) fpEntry.forecastNext7Days += fpUnits;
      }
    }

    // CURRENT INVENTORY → convert raw inventory into finished product units
    for (const fp of finishedProducts) {
      const fpEntry = schedule[fp._id];

      let possibleUnits = Infinity;

      for (const ing of fp.ingredients) {
        const item = ing.itemId;

        const inv = inventory.find(
          (i) => i.itemId.toString() === item._id.toString(),
        );
        const stock = inv ? inv.quantity : 0;

        const unitsFromThisIngredient = stock / ing.quantityUsed;

        possibleUnits = Math.min(possibleUnits, unitsFromThisIngredient);

        fpEntry.ingredients.push({
          itemId: item._id,
          name: item.name,
          stock,
          quantityUsedPerUnit: ing.quantityUsed,
          unitsPossible: unitsFromThisIngredient,
        });
      }

      fpEntry.currentInventoryUnits = Math.floor(possibleUnits);
    }

    // REQUIRED PREP
    for (const id in schedule) {
      const fp = schedule[id];

      const needed = fp.forecastNext7Days - fp.currentInventoryUnits;
      fp.requiredPrepUnits = needed > 0 ? Math.ceil(needed) : 0;
    }

    // SCHEDULING LOGIC
    for (const id in schedule) {
      const fp = schedule[id];

      if (fp.requiredPrepUnits === 0) {
        fp.recommendedPrepTimes = ["No prep needed"];
        continue;
      }

      // Split prep into time blocks
      const morning = Math.ceil(fp.requiredPrepUnits * 0.5);
      const midday = Math.ceil(fp.requiredPrepUnits * 0.3);
      const evening = Math.ceil(fp.requiredPrepUnits * 0.2);

      fp.recommendedPrepTimes = [
        { time: "Morning (6–10 AM)", units: morning },
        { time: "Midday (11 AM–2 PM)", units: midday },
        { time: "Evening (4–7 PM)", units: evening },
      ];
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      batchPrepSchedule: schedule,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
