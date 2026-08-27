const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");

// MENU ENGINEERING DASHBOARD
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate("itemId");

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    const dashboard = {};

    // Initialize dashboard entries
    for (const fp of finishedProducts) {
      dashboard[fp._id] = {
        finishedProductId: fp._id,
        name: fp.name,
        photoUrl: fp.photoUrl,
        costPerUnit: 0,
        totalUsage: 0,
        totalWaste: 0,
        totalCostImpact: 0,
        ingredients: fp.ingredients.map((ing) => ({
          itemId: ing.itemId._id,
          name: ing.itemId.name,
          quantityUsed: ing.quantityUsed,
          unitPrice: ing.itemId.currentPrice,
          cost: ing.quantityUsed * ing.itemId.currentPrice,
        })),
      };

      // Calculate cost per finished product
      dashboard[fp._id].costPerUnit = dashboard[fp._id].ingredients.reduce(
        (sum, ing) => sum + ing.cost,
        0,
      );
    }

    // USAGE IMPACT
    for (const u of usageRecords) {
      const item = u.itemId;

      // Find finished products that use this raw item
      for (const fp of finishedProducts) {
        const ingredient = fp.ingredients.find(
          (ing) => ing.itemId._id.toString() === item._id.toString(),
        );

        if (ingredient) {
          const fpEntry = dashboard[fp._id];

          fpEntry.totalUsage += u.quantity / ingredient.quantityUsed;
          fpEntry.totalCostImpact += u.quantity * item.currentPrice;
        }
      }
    }

    // WASTE IMPACT
    for (const w of wasteRecords) {
      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const fpEntry = dashboard[w.finishedProductId._id];
        fpEntry.totalWaste += w.quantity;
        fpEntry.totalCostImpact += fpEntry.costPerUnit * w.quantity;
      }

      // RAW WASTE (affects finished products indirectly)
      if (w.type === "raw") {
        const item = w.rawItemId;

        for (const fp of finishedProducts) {
          const ingredient = fp.ingredients.find(
            (ing) => ing.itemId._id.toString() === item._id.toString(),
          );

          if (ingredient) {
            const fpEntry = dashboard[fp._id];
            fpEntry.totalWaste += w.quantity / ingredient.quantityUsed;
            fpEntry.totalCostImpact += w.quantity * item.currentPrice;
          }
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      menuEngineering: dashboard,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
