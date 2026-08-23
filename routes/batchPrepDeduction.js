const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

// BATCH PREP INVENTORY DEDUCTION
router.post("/:storeId/:finishedProductId", async (req, res) => {
  try {
    const { storeId, finishedProductId } = req.params;
    const { quantity } = req.body;

    const batchQty = Number(quantity || 1);

    const fp =
      await FinishedProduct.findById(finishedProductId).populate(
        "ingredients.itemId",
      );

    if (!fp)
      return res.status(404).json({ error: "Finished product not found" });

    const deductionResults = [];
    const warnings = [];

    for (const ing of fp.ingredients) {
      const item = ing.itemId;

      const requiredQty = ing.quantityUsed * batchQty;

      // Find inventory record
      let inventory = await InventoryCount.findOne({
        storeId,
        itemId: item._id,
      });

      if (!inventory) {
        // Create inventory record if missing
        inventory = await InventoryCount.create({
          storeId,
          itemId: item._id,
          quantity: 0,
        });
      }

      const beforeQty = inventory.quantity;
      const afterQty = Math.max(0, beforeQty - requiredQty);

      // Update inventory
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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
