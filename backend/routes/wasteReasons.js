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
   Waste Reasons Dashboard (Fixed)
------------------------------------------------------- */
router.get("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!storeId) throwError("storeId is required", 400);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const store = await Store.findById(storeId);
    if (!store) throwError("Store not found", 404);

    /* -------------------------------------------------------
       Deep populate (fixes N+1 problem)
    ------------------------------------------------------- */
    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        select: "name currentPrice photoUrl",
      })
      .populate({
        path: "finishedProductId",
        select: "name photoUrl",
        populate: {
          path: "ingredients.itemId",
          select: "name currentPrice photoUrl",
        },
      });

    if (!wasteRecords.length)
      throwError("No waste records found for this store", 404);

    const reasons = {};

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

      /* -------------------------------------------------------
         RAW WASTE
      ------------------------------------------------------- */
      if (w.type === "raw") {
        const item = w.rawItemId;

        if (!item)
          throwError("Raw item reference missing in waste record", 500);

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

      /* -------------------------------------------------------
         FINISHED PRODUCT WASTE
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
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
