const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const Item = require("../models/Item");
const FinishedProduct = require("../models/FinishedProduct");

// CATEGORY ANALYTICS
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

    // Load usage + waste
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

    const categoryData = {}; // categoryId → { usage, waste, cost }

    // USAGE ANALYTICS
    for (const u of usageRecords) {
      const item = u.itemId;
      const categoryId = item.categoryId?.toString() || "Uncategorized";

      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          usage: 0,
          waste: 0,
          cost: 0,
          items: [],
        };
      }

      categoryData[categoryId].usage += u.quantity;

      categoryData[categoryId].items.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        quantity: u.quantity,
        currentPrice: item.currentPrice,
      });

      categoryData[categoryId].cost += u.quantity * item.currentPrice;
    }

    // WASTE ANALYTICS
    for (const w of wasteRecords) {
      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const categoryId = item.categoryId?.toString() || "Uncategorized";

        if (!categoryData[categoryId]) {
          categoryData[categoryId] = {
            usage: 0,
            waste: 0,
            cost: 0,
            items: [],
          };
        }

        const cost = item.currentPrice * w.quantity;

        categoryData[categoryId].waste += w.quantity;
        categoryData[categoryId].cost += cost;
      }

      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        for (const ing of finished.ingredients) {
          const item = ing.itemId;
          const categoryId = item.categoryId?.toString() || "Uncategorized";

          if (!categoryData[categoryId]) {
            categoryData[categoryId] = {
              usage: 0,
              waste: 0,
              cost: 0,
              items: [],
            };
          }

          const quantityUsed = ing.quantityUsed * w.quantity;
          const cost = item.currentPrice * quantityUsed;

          categoryData[categoryId].waste += quantityUsed;
          categoryData[categoryId].cost += cost;
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      categories: categoryData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
