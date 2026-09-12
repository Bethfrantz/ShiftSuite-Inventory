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

// MENU ENGINEERING DASHBOARD
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
      select: "name photoUrl color",
    });
    if (!finishedProducts.length) throwError("No finished products found", 404);

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate({
      path: "itemId",
      select: "name photoUrl color",
    });
    if (!usageRecords.length) throwError("No usage records found", 404);

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        select: "name photoUrl color",
      })
      .populate({
        path: "finishedProductId",
        select: "name photoUrl color",
      });
    if (!usageRecords.length && !wasteRecords.length)
      throwError("No usage or waste records found for this store", 404);

    const dashboard = {};

    // Initialize dashboard entries
    for (const fp of finishedProducts) {
      dashboard[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        costPerUnit: 0,
        totalUsage: 0,
        totalWaste: 0,
        totalCostImpact: 0,
        ingredients: fp.ingredients.map((ing) => ({
          itemId: ing.itemId._id,
          name: ing.itemId.name,
          quantityUsed: ing.quantityUsed,
          unitPrice: ing.itemId.currentPrice,
          cost: ing.quantityUsed * ing.itemId.currentPrice,
        })),
      };

      // Calculate cost per finished product
      dashboard[fp._id].costPerUnit = dashboard[fp._id].ingredients.reduce(
        (sum, ing) => sum + ing.cost,
        0,
      );
    }

    // USAGE IMPACT
    for (const u of usageRecords) {
      const item = u.itemId;

      // Find finished products that use this raw item
      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (ingredient) {
          const fpEntry = dashboard[fp._id];

          fpEntry.totalUsage += u.quantity / ingredient.quantityUsed;
          fpEntry.totalCostImpact += u.quantity * item.currentPrice;
        }
      }
    }

    // WASTE IMPACT
    for (const w of wasteRecords) {
      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const fpEntry = dashboard[w.finishedProductId._id];
        fpEntry.totalWaste += w.quantity;
        fpEntry.totalCostImpact += fpEntry.costPerUnit * w.quantity;
      }

      // RAW WASTE (affects finished products indirectly)
      if (w.type === "raw") {
        const item = w.rawItemId;

        for (const fp of finishedProducts) {
          const ingredient = fp.ingredients.find(
            (ing) => ing.itemId._id.toString() === item._id.toString(),
          );

          if (ingredient) {
            const fpEntry = dashboard[fp._id];
            fpEntry.totalWaste += w.quantity / ingredient.quantityUsed;
            fpEntry.totalCostImpact += w.quantity * item.currentPrice;
          }
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
        district: store.district,
      },
      menuEngineering: dashboard,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
