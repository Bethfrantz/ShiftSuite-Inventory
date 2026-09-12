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

module.exports = router;
