const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

/* -------------------------------------------------------------
  Helper: Throw formatted errors
------------------------------------------------------------- */

const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};
/* -------------------------------------------------------------
  Middleware: Attach Request ID 
------------------------------------------------------------- */
const { v4: uuid } = require("uuid");
router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});
// Middleware: Logging
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} - Body:`,
    req.body,
  );
  next();
});

// BATCH PREP PLANNER
router.get("/:storeId/:finishedProductId", async (req, res, next) => {
  try {
    const { storeId, finishedProductId } = req.params;
    const { quantity } = req.query;

    const batchQty = Number(quantity || 1);

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp) throwError("Finished product not found", 404);

    let totalBatchCost = 0;
    const ingredientPlan = [];

    for (const ing of fp.ingredients) {
      const item = ing.itemId;

      const requiredQty = ing.quantityUsed * batchQty;
      const cost = requiredQty * item.currentPrice;

      totalBatchCost += cost;

      // Correct inventory lookup
      const inventory = await InventoryCount.findOne({
        storeId: storeId,
        itemId: item._id,
      });

      const currentStock = inventory ? inventory.quantity : 0;
      const shortage = requiredQty > currentStock;

      ingredientPlan.push({
        itemId: item._id,
        name: item.name,
        quantityUsedPerUnit: ing.quantityUsed,
        requiredQty,
        currentStock,
        shortage,
        unitPrice: item.currentPrice,
        cost,
        photoUrl: item.photoUrl,
      });
    }

    res.json({
      finishedProductId: fp._id,
      name: fp.name,
      photoUrl: fp.photoUrl,
      batchQuantity: batchQty,
      totalBatchCost,
      ingredients: ingredientPlan,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
