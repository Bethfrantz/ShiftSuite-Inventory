const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

// BATCH PREP PLANNER
router.get("/:storeId/:finishedProductId", async (req, res) => {
  try {
    const { storeId, finishedProductId } = req.params;
    const { quantity } = req.query;

    const batchQty = Number(quantity || 1);

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp)
      return res.status(404).json({ error: "Finished product not found" });

    let totalBatchCost = 0;
    const ingredientPlan = [];

    for (const ing of fp.ingredients) {
      const item = ing.itemId;

      const requiredQty = ing.quantityUsed * batchQty;
      const cost = requiredQty * item.currentPrice;

      totalBatchCost += cost;

      // Check inventory
      const inventory = await InventoryCount.findOne({
        storeId,
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
