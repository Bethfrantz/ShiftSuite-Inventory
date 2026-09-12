const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const FinishedProduct = require("../models/FinishedProduct");

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

// STORE DEMAND FORECASTING
router.get("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) throwError("Store not found", 404);

    const finishedProducts = await FinishedProduct.find().populate({
      path: "ingredients.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    if (!finishedProducts.length) throwError("No finished products found", 404);

    // Load last 30 days of usage
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    if (!usageRecords.length)
      throwError("No usage records found for the last 30 days", 404);

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
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
