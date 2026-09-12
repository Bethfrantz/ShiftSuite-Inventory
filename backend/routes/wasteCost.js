const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
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
   Middleware: Attach Request ID
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

/* -------------------------------------------------------
   Waste Cost Analysis (Fixed)
------------------------------------------------------- */
router.get("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate storeId
    if (!storeId) throwError("storeId is required", 400);

    // Date filtering
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) throwError("Store not found", 404);

    // Fetch waste records with deep populate (fixes N+1 problem)
    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        select: "name photoUrl currentPrice",
        populate: { path: "categoryId", select: "name photoUrl color" },
      })
      .populate({
        path: "finishedProductId",
        select: "name photoUrl",
        populate: [
          { path: "categoryId", select: "name photoUrl color" },
          {
            path: "ingredients.itemId",
            select: "name currentPrice photoUrl",
          },
        ],
      });

    if (!wasteRecords.length)
      throwError("No waste records found for this store", 404);

    let rawWasteCost = [];
    let finishedWasteCost = [];
    let totalCost = 0;

    for (const w of wasteRecords) {
      /* -------------------------------------------------------
         RAW WASTE COST
      ------------------------------------------------------- */
      if (w.type === "raw") {
        const item = w.rawItemId;

        if (!item)
          throwError("Raw item reference missing in waste record", 500);

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

      /* -------------------------------------------------------
         FINISHED PRODUCT WASTE COST
      ------------------------------------------------------- */
      if (w.type === "finished") {
        const finished = w.finishedProductId;

        if (!finished)
          throwError("Finished product reference missing in waste record", 500);

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
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
