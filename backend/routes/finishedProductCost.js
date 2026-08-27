const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// FINISHED PRODUCT COST CALCULATOR
router.get("/:finishedProductId", async (req, res) => {
  try {
    const { finishedProductId } = req.params;
    const { quantity } = req.query; // optional: calculate cost for multiple units

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp)
      return res.status(404).json({ error: "Finished product not found" });

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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
