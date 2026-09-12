const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const Item = require("../models/Item");
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

// CATEGORY ANALYTICS
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

    // FIXED: Usage + Waste lookup
    const usageRecords = await Usage.find({
      store: storeId,
      ...dateQuery,
    }).populate("itemId");

    const wasteRecords = await Waste.find({
      store: storeId,
      ...dateQuery,
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    const categoryData = {}; // categoryId → { usage, waste, cost, items }

    // USAGE ANALYTICS
    for (const u of usageRecords) {
      const item = u.itemId;
      const categoryId = item.categoryId?.toString() || "Uncategorized";

      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          usage: 0,
          waste: 0,
          cost: 0,
          items: [],
        };
      }

      categoryData[categoryId].usage += u.quantity;

      categoryData[categoryId].items.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        quantity: u.quantity,
        currentPrice: item.currentPrice,
      });

      categoryData[categoryId].cost += u.quantity * item.currentPrice;
    }

    // WASTE ANALYTICS
    for (const w of wasteRecords) {
      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const categoryId = item.categoryId?.toString() || "Uncategorized";

        if (!categoryData[categoryId]) {
          categoryData[categoryId] = {
            usage: 0,
            waste: 0,
            cost: 0,
            items: [],
          };
        }

        const cost = item.currentPrice * w.quantity;

        categoryData[categoryId].waste += w.quantity;
        categoryData[categoryId].cost += cost;
      }

      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        for (const ing of finished.ingredients) {
          const item = ing.itemId;
          const categoryId = item.categoryId?.toString() || "Uncategorized";

          if (!categoryData[categoryId]) {
            categoryData[categoryId] = {
              usage: 0,
              waste: 0,
              cost: 0,
              items: [],
            };
          }

          const quantityUsed = ing.quantityUsed * w.quantity;
          const cost = item.currentPrice * quantityUsed;

          categoryData[categoryId].waste += quantityUsed;
          categoryData[categoryId].cost += cost;
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      categories: categoryData,
      requestId: req.requestId, // helpful for debugging
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
