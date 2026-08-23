const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const InventoryCount = require("../models/InventoryCount");
const FinishedProduct = require("../models/FinishedProduct");
const Usage = require("../models/Usage");

// BATCH PREP CALENDAR
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

    // Load usage for forecasting
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    const calendarEvents = [];

    // FORECAST DEMAND (same logic as demand forecasting)
    const forecastMap = {};

    for (const fp of finishedProducts) {
      forecastMap[fp._id] = {
        usage7: 0,
        usage14: 0,
        usage30: 0,
      };
    }

    for (const u of usageRecords) {
      const item = u.itemId;
      const daysAgo =
        (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (!ingredient) continue;

        const fpUnits = u.quantity / ingredient.quantityUsed;

        if (daysAgo <= 7) forecastMap[fp._id].usage7 += fpUnits;
        if (daysAgo <= 14) forecastMap[fp._id].usage14 += fpUnits;
        forecastMap[fp._id].usage30 += fpUnits;
      }
    }

    // Calculate forecast
    const forecastNext7 = {};

    for (const fp of finishedProducts) {
      const f = forecastMap[fp._id];

      const avg7 = f.usage7 / 7;
      const avg14 = f.usage14 / 14;
      const avg30 = f.usage30 / 30;

      const movingAverage = avg7 * 0.5 + avg14 * 0.3 + avg30 * 0.2;

      const trend = avg7 > avg14 ? 1.15 : avg7 < avg14 ? 0.9 : 1.0;

      forecastNext7[fp._id] = Math.round(movingAverage * trend * 7);
    }

    // CURRENT INVENTORY → convert raw inventory into finished product units
    const inventoryUnits = {};

    for (const fp of finishedProducts) {
      let possibleUnits = Infinity;

      for (const ing of fp.ingredients) {
        const item = ing.itemId;

        const inv = inventory.find(
          (i) => i.itemId.toString() === item._id.toString(),
        );
        const stock = inv ? inv.quantity : 0;

        const unitsFromIngredient = stock / ing.quantityUsed;

        possibleUnits = Math.min(possibleUnits, unitsFromIngredient);
      }

      inventoryUnits[fp._id] = Math.floor(possibleUnits);
    }

    // REQUIRED PREP
    const requiredPrep = {};

    for (const fp of finishedProducts) {
      const needed = forecastNext7[fp._id] - inventoryUnits[fp._id];
      requiredPrep[fp._id] = needed > 0 ? Math.ceil(needed) : 0;
    }

    // BUILD CALENDAR EVENTS
    const today = new Date();

    for (const fp of finishedProducts) {
      const units = requiredPrep[fp._id];

      if (units === 0) continue;

      const morningUnits = Math.ceil(units * 0.5);
      const middayUnits = Math.ceil(units * 0.3);
      const eveningUnits = Math.ceil(units * 0.2);

      const events = [
        {
          title: `${fp.name} Prep`,
          productId: fp._id,
          units: morningUnits,
          block: "Morning",
          start: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            6,
            0,
          ),
          end: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            10,
            0,
          ),
          color: "#4CAF50",
        },
        {
          title: `${fp.name} Prep`,
          productId: fp._id,
          units: middayUnits,
          block: "Midday",
          start: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            11,
            0,
          ),
          end: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            14,
            0,
          ),
          color: "#2196F3",
        },
        {
          title: `${fp.name} Prep`,
          productId: fp._id,
          units: eveningUnits,
          block: "Evening",
          start: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            16,
            0,
          ),
          end: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            19,
            0,
          ),
          color: "#FF9800",
        },
      ];

      calendarEvents.push(...events);
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      calendar: calendarEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
