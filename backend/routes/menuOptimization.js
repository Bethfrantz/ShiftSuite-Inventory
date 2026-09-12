const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

/* -------------------------------------------------------
   Helper: Throw formatted errors
------------------------------------------------------- */
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

/* -------------------------------------------------------
   Middleware: Attach Request ID (Step 5)
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging (Step 6)
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

// MENU OPTIMIZATION SUGGESTIONS
router.get("/:storeId", async (req, res, next) => {
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
    if (!store) throwError("Store not found", 404);

    const finishedProducts = await FinishedProduct.find().populate({
      path: "ingredients.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });
    if (!finishedProducts.length) throwError("No finished products found", 404);

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate({
      path: "itemId",
      select: "name photoUrl color",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        select: "name photoUrl color",
        populate: { path: "categoryId", select: "name photoUrl color" },
      })
      .populate({
        path: "finishedProductId",
        select: "name photoUrl color",
        populate: { path: "categoryId", select: "name photoUrl color" },
      });
    if (!usageRecords.length && !wasteRecords.length)
      throwError(
        "No usage or waste records found for the specified date range",
        404,
      );

    const suggestions = {};

    // Initialize entries
    for (const fp of finishedProducts) {
      const costPerUnit = fp.ingredients.reduce((sum, ing) => {
        return sum + ing.itemId.currentPrice * ing.quantityUsed;
      }, 0);

      suggestions[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        costPerUnit,
        usage: 0,
        wasteUnits: 0,
        wasteCost: 0,
        suggestion: "",
        reasons: [],
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
          const fpEntry = suggestions[fp._id];
          fpEntry.usage += u.quantity / ingredient.quantityUsed;
        }
      }
    }

    // WASTE IMPACT
    for (const w of wasteRecords) {
      // Finished product waste
      if (w.type === "finished") {
        const fpEntry = suggestions[w.finishedProductId._id];
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
            const fpEntry = suggestions[fp._id];
            const quantityUsed = w.quantity / ingredient.quantityUsed;
            fpEntry.wasteUnits += quantityUsed;
            fpEntry.wasteCost += w.quantity * item.currentPrice;
          }
        }
      }
    }

    // SUGGESTION LOGIC
    for (const id in suggestions) {
      const fp = suggestions[id];

      const highUsage = fp.usage > 100;
      const lowUsage = fp.usage < 30;

      const highWaste = fp.wasteUnits > 10;
      const lowWaste = fp.wasteUnits < 3;

      const highCost = fp.costPerUnit > 3.5;
      const lowCost = fp.costPerUnit < 1.5;

      // PROMOTE
      if (highUsage && lowWaste && lowCost) {
        fp.suggestion = "Promote";
        fp.reasons.push("High usage");
        fp.reasons.push("Low waste");
        fp.reasons.push("Low cost");
        continue;
      }

      // REMOVE
      if (lowUsage && highWaste && highCost) {
        fp.suggestion = "Remove";
        fp.reasons.push("Low usage");
        fp.reasons.push("High waste");
        fp.reasons.push("High cost");
        continue;
      }

      // IMPROVE
      if (highWaste || highCost) {
        fp.suggestion = "Improve";
        if (highWaste) fp.reasons.push("High waste");
        if (highCost) fp.reasons.push("High cost");
        continue;
      }

      // MONITOR
      fp.suggestion = "Monitor";
      fp.reasons.push("Stable performance");
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
        district: store.district,
      },
      menuOptimization: suggestions,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
