const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const Item = require("../models/Item");
const FinishedProduct = require("../models/FinishedProduct");

// VENDOR ANALYTICS
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

    const finishedProducts =
      await FinishedProduct.find().populate("ingredients.itemId");

    const vendorData = {}; // vendor → { usage, waste, cost, items }

    // USAGE ANALYTICS
    for (const u of usageRecords) {
      const item = u.itemId;
      const vendor = item.vendor || "Unknown Vendor";

      if (!vendorData[vendor]) {
        vendorData[vendor] = {
          usage: 0,
          waste: 0,
          cost: 0,
          items: [],
        };
      }

      vendorData[vendor].usage += u.quantity;
      vendorData[vendor].cost += u.quantity * item.currentPrice;

      vendorData[vendor].items.push({
        itemId: item._id,
        name: item.name,
        quantity: u.quantity,
        currentPrice: item.currentPrice,
        categoryId: item.categoryId,
      });
    }

    // WASTE ANALYTICS
    for (const w of wasteRecords) {
      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const vendor = item.vendor || "Unknown Vendor";

        if (!vendorData[vendor]) {
          vendorData[vendor] = {
            usage: 0,
            waste: 0,
            cost: 0,
            items: [],
          };
        }

        const cost = item.currentPrice * w.quantity;

        vendorData[vendor].waste += w.quantity;
        vendorData[vendor].cost += cost;
      }

      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        for (const ing of finished.ingredients) {
          const item = ing.itemId;
          const vendor = item.vendor || "Unknown Vendor";

          if (!vendorData[vendor]) {
            vendorData[vendor] = {
              usage: 0,
              waste: 0,
              cost: 0,
              items: [],
            };
          }

          const quantityUsed = ing.quantityUsed * w.quantity;
          const cost = item.currentPrice * quantityUsed;

          vendorData[vendor].waste += quantityUsed;
          vendorData[vendor].cost += cost;
        }
      }
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      vendors: vendorData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
