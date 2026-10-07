const express = require("express");
const router = express.Router();
const Usage = require("../models/Usage");
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

/* -------------------------------------------------------
   USAGE CALCULATION ROUTE
   POST /usage/calculate
------------------------------------------------------- */
router.post("/calculate", async (req, res, next) => {
  try {
    const { storeId, finishedProductId, quantityProduced, timestamp } =
      req.body;

    if (!storeId || !finishedProductId || !quantityProduced) {
      const err = new Error(
        "storeId, finishedProductId, and quantityProduced are required",
      );
      err.statusCode = 400;
      throw err;
    }

    /* -------------------------------------------------------
       1. Load finished product + recipe
    ------------------------------------------------------- */
    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "recipe.itemId",
      );

    if (!fp) {
      const err = new Error("Finished product not found");
      err.statusCode = 404;
      throw err;
    }

    /* -------------------------------------------------------
       2. Build usage entries from recipe
    ------------------------------------------------------- */
    const usageEntries = [];

    for (const ingredient of fp.recipe) {
      const item = ingredient.itemId;

      const quantityUsed = ingredient.quantity * quantityProduced;

      const costImpact = quantityUsed * (item.currentPrice || 0);

      usageEntries.push({
        storeId,
        finishedProductId,
        itemId: item._id,
        quantityUsed,
        unitType: ingredient.unitType || "each",
        timestamp: timestamp || new Date(),
        costImpact,
      });
    }

    /* -------------------------------------------------------
       3. Insert usage documents
    ------------------------------------------------------- */
    const savedUsage = await Usage.insertMany(usageEntries);

    res.json({
      requestId: req.requestId,
      message: "Usage calculated successfully",
      usage: savedUsage,
    });
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------
   EXISTING USAGE ROUTES (unchanged)
------------------------------------------------------- */

// Get all usage
router.get("/", async (req, res, next) => {
  try {
    const usage = await Usage.find()
      .populate("itemId")
      .populate("finishedProductId")
      .populate("storeId");
    res.json(usage);
  } catch (err) {
    next(err);
  }
});

// Get usage for a store
router.get("/store/:storeId", async (req, res, next) => {
  try {
    const usage = await Usage.find({ storeId: req.params.storeId })
      .populate("itemId")
      .populate("finishedProductId");
    res.json(usage);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
