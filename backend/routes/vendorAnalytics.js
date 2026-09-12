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

// VENDOR ANALYTICS
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

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate({
      path: "itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        populate: { path: "categoryId", select: "name photoUrl color" },
      })
      .populate({
        path: "finishedProductId",
        populate: { path: "categoryId", select: "name photoUrl color" },
      });

    if (!usageRecords.length && !wasteRecords.length)
      throwError(
        "No usage or waste records found for the specified date range",
        404,
      );

    const finishedProducts = await FinishedProduct.find().populate({
      path: "ingredients.itemId",
      select: "name photoUrl color",
    });
    if (!finishedProducts.length) throwError("No finished products found", 404);

    const vendorData = {}; // vendor → { usage, waste, cost, items }

    // USAGE ANALYTICS
    for (const u of usageRecords) {
      const item = u.itemId;
      const vendor = item.vendor?.trim() || "Unknown Vendor";

      if (!vendorData[vendor]) {
        vendorData[vendor] = {
          usage: 0,
          waste: 0,
          cost: 0,
          items: [],
        };
      }

      vendorData[vendor].usage += u.quantity;
      vendorData[vendor].cost += u.quantity * item.currentPrice;

      vendorData[vendor].items.push({
        itemId: item._id,
        name: item.name,
        quantity: u.quantity,
        currentPrice: item.currentPrice,
        categoryId: item.categoryId,
      });
    }

    // WASTE ANALYTICS
    for (const w of wasteRecords) {
      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const vendor = item.vendor?.trim() || "Unknown Vendor";

        if (!vendorData[vendor]) {
          vendorData[vendor] = {
            usage: 0,
            waste: 0,
            cost: 0,
            items: [],
          };
        }

        const cost = item.currentPrice * w.quantity;

        vendorData[vendor].waste += w.quantity;
        vendorData[vendor].cost += cost;
      }

      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        for (const ing of finished.ingredients) {
          const item = ing.itemId;
          const vendor = item.vendor?.trim() || "Unknown Vendor";

          if (!vendorData[vendor]) {
            vendorData[vendor] = {
              usage: 0,
              waste: 0,
              cost: 0,
              items: [],
            };
          }

          const quantityUsed = ing.quantityUsed * w.quantity;
          const cost = item.currentPrice * quantityUsed;

          vendorData[vendor].waste += quantityUsed;
          vendorData[vendor].cost += cost;
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      vendors: vendorData,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
