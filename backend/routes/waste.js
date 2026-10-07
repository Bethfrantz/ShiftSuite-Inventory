const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const InventoryCount = require("../models/InventoryCount");

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
   Create Waste Record (Fixed)
------------------------------------------------------- */
router.post("/", async (req, res, next) => {
  try {
    const { storeId, type, rawItemId, finishedProductId, quantity, reason } =
      req.body;

    // Basic validation
    if (!storeId || !type || !quantity)
      throwError("storeId, type, and quantity are required", 400);

    if (quantity <= 0) throwError("quantity must be greater than zero", 400);

    if (type === "raw" && !rawItemId)
      throwError("rawItemId is required for raw waste", 400);

    if (type === "finished" && !finishedProductId)
      throwError("finishedProductId is required for finished waste", 400);

    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) throwError("Store not found", 404);

    // Save waste record
    const waste = await Waste.create({
      storeId,
      type,
      rawItemId,
      finishedProductId,
      quantity,
      reason,
    });

    /* -------------------------------------------------------
       RAW WASTE
    ------------------------------------------------------- */
    if (type === "raw") {
      const inv = await InventoryCount.findOne({ storeId, itemId: rawItemId });
      if (!inv) throwError("Inventory count not found for raw item", 404);

      if (inv.quantity - quantity < 0)
        throwError("Cannot waste raw item: inventory would go negative", 400);

      await InventoryCount.updateOne(
        { storeId, itemId: rawItemId },
        { $inc: { quantity: -quantity } },
      );
    }

    /* -------------------------------------------------------
       FINISHED PRODUCT WASTE
    ------------------------------------------------------- */
    if (type === "finished") {
      const finished = await FinishedProduct.findById(
        finishedProductId,
      ).populate({
        path: "ingredients.itemId",
        select: "name currentPrice photoUrl",
      });

      if (!finished) throwError("Finished product not found", 404);

      for (const ingredient of finished.ingredients) {
        const inv = await InventoryCount.findOne({
          storeId,
          itemId: ingredient.itemId._id,
        });

        if (!inv)
          throwError(
            `Inventory count not found for ingredient ${ingredient.itemId.name}`,
            404,
          );

        const deduction = ingredient.quantityUsed * quantity;

        if (inv.quantity - deduction < 0)
          throwError(
            `Cannot waste finished product: ingredient ${ingredient.itemId.name} would go negative`,
            400,
          );

        await InventoryCount.updateOne(
          { storeId, itemId: ingredient.itemId._id },
          { $inc: { quantity: -deduction } },
        );
      }
    }

    res.json({ waste, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});
/* -------------------------------------------------------
   WASTE REPORT
   GET /waste/report?storeId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
------------------------------------------------------- */
router.get("/report", async (req, res, next) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    if (!storeId) throwError("storeId is required", 400);

    // Default: last 7 days
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const end = endDate ? new Date(endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    /* -------------------------------------------------------
       1. Pull waste records for store + date range
    ------------------------------------------------------- */
    const wasteRecords = await Waste.find({
      storeId,
      timestamp: { $gte: start, $lte: end },
    }).populate("rawItemId");

    if (!wasteRecords.length) {
      return res.json({
        requestId: req.requestId,
        storeId,
        startDate: start,
        endDate: end,
        items: [],
        categories: [],
        reasons: [],
        totals: {
          totalWasteQuantity: 0,
          totalWasteCost: 0,
        },
      });
    }

    /* -------------------------------------------------------
       2. Group waste by item
    ------------------------------------------------------- */
    const itemMap = new Map();

    for (const w of wasteRecords) {
      const item = w.rawItemId;
      if (!item) continue;

      const id = item._id.toString();
      const price = item.currentPrice || 0;

      if (!itemMap.has(id)) {
        itemMap.set(id, {
          itemId: id,
          name: item.name,
          categoryId: item.categoryId,
          quantity: 0,
          cost: 0,
        });
      }

      const entry = itemMap.get(id);
      entry.quantity += w.quantity;
      entry.cost += w.quantity * price;
    }

    const items = Array.from(itemMap.values());

    /* -------------------------------------------------------
       3. Group waste by category
    ------------------------------------------------------- */
    const categoryIds = [...new Set(items.map((i) => i.categoryId))];
    const categories = await Category.find({ _id: { $in: categoryIds } });

    const categoryMap = new Map();

    for (const item of items) {
      const catId = item.categoryId.toString();
      const cat = categories.find((c) => c._id.toString() === catId);

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: cat ? cat.name : "Unknown Category",
          quantity: 0,
          cost: 0,
        });
      }

      const entry = categoryMap.get(catId);
      entry.quantity += item.quantity;
      entry.cost += item.cost;
    }

    const categorySummary = Array.from(categoryMap.values());

    /* -------------------------------------------------------
       4. Waste reasons breakdown
    ------------------------------------------------------- */
    const reasonMap = new Map();

    for (const w of wasteRecords) {
      const reason = w.reason || "Unspecified";

      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, {
          reason,
          quantity: 0,
        });
      }

      const entry = reasonMap.get(reason);
      entry.quantity += w.quantity;
    }

    const reasons = Array.from(reasonMap.values());

    /* -------------------------------------------------------
       5. Totals
    ------------------------------------------------------- */
    const totalWasteQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalWasteCost = items.reduce((sum, i) => sum + i.cost, 0);

    /* -------------------------------------------------------
       6. Final response
    ------------------------------------------------------- */
    res.json({
      requestId: req.requestId,
      storeId,
      startDate: start,
      endDate: end,
      items,
      categories: categorySummary,
      reasons,
      totals: {
        totalWasteQuantity,
        totalWasteCost,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
