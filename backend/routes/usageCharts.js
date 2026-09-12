const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
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

// Store usage charts
router.get("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    // groupBy can be: day, week, month, category, vendor, item
    const grouping = groupBy || "day";

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

    if (!usageRecords.length)
      throwError("No usage records found for this store", 404);

    const chartData = {};

    for (const u of usageRecords) {
      const item = u.itemId;

      // Determine grouping key
      let key;

      if (grouping === "day") {
        key = u.createdAt.toISOString().split("T")[0];
      } else if (grouping === "week") {
        const d = new Date(u.createdAt);
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getFullYear()}-${d.getMonth() + 1}-W${week}`;
      } else if (grouping === "month") {
        const d = new Date(u.createdAt);
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      } else if (grouping === "category") {
        key = item.categoryId?._id?.toString() || "Uncategorized";
      } else if (grouping === "vendor") {
        key = item.vendor?.trim() || "Unknown Vendor";
      } else if (grouping === "item") {
        key = item._id.toString();
      }

      if (!chartData[key]) {
        chartData[key] = {
          totalUsage: 0,
          items: [],
        };
      }

      chartData[key].totalUsage += u.quantity;

      chartData[key].items.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        categoryId: item.categoryId?._id || null,
        quantity: u.quantity,
      });
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      grouping,
      chartData,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
