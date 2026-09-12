const express = require("express");
const router = express.Router();

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

// FINISHED PRODUCT COST CALCULATOR
router.get("/:finishedProductId", async (req, res, next) => {
  try {
    const { finishedProductId } = req.params;
    const { quantity } = req.query; // optional: calculate cost for multiple units

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp) throwError("Finished product not found", 404);

    let totalCost = 0;

    const ingredientBreakdown = fp.ingredients.map((ing) => {
      const item = ing.itemId;
      const costPerIngredient = item.currentPrice * ing.quantityUsed;

      totalCost += costPerIngredient;

      return {
        itemId: item._id,
        name: item.name,
        quantityUsed: ing.quantityUsed,
        unitPrice: item.currentPrice,
        cost: costPerIngredient,
        photoUrl: item.photoUrl,
      };
    });

    const finalQuantity = quantity ? Number(quantity) : 1;
    const totalCostForQuantity = totalCost * finalQuantity;

    res.json({
      finishedProductId: fp._id,
      name: fp.name,
      photoUrl: fp.photoUrl,
      costPerUnit: totalCost,
      quantityRequested: finalQuantity,
      totalCostForQuantity,
      ingredients: ingredientBreakdown,
      requestId: req.requestId, // helpful for debugging
    });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

module.exports = router;
