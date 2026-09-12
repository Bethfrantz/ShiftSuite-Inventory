const express = require("express");
const router = express.Router();

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

// BATCH PREP INVENTORY DEDUCTION
router.post("/:storeId/:finishedProductId", async (req, res, next) => {
  try {
    const { storeId, finishedProductId } = req.params;
    const { quantity } = req.body;

    const batchQty = Number(quantity || 1);

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp) throwError("Finished product not found", 404);

    const deductionResults = [];
    const warnings = [];

    for (const ing of fp.ingredients) {
      const item = ing.itemId;

      const requiredQty = ing.quantityUsed * batchQty;

      // FIXED: correct inventory lookup
      let inventory = await InventoryCount.findOne({
        storeId: storeId,
        itemId: item._id,
      });

      if (!inventory) {
        inventory = await InventoryCount.create({
          storeId: storeId,
          itemId: item._id,
          quantity: 0,
        });
      }

      const beforeQty = inventory.quantity;
      const afterQty = Math.max(0, beforeQty - requiredQty);

      inventory.quantity = afterQty;
      await inventory.save();

      deductionResults.push({
        itemId: item._id,
        name: item.name,
        requiredQty,
        beforeQty,
        afterQty,
        photoUrl: item.photoUrl,
      });

      // Par-level warning
      const parLevel = item.parLevels?.find(
        (p) => p.storeId.toString() === storeId,
      );

      if (parLevel && afterQty < parLevel.par) {
        warnings.push({
          itemId: item._id,
          name: item.name,
          message: `Stock below par level (${afterQty} < ${parLevel.par})`,
        });
      }
    }

    res.json({
      finishedProductId: fp._id,
      name: fp.name,
      batchQuantity: batchQty,
      deductions: deductionResults,
      warnings,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
