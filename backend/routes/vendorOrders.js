const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Usage = require("../models/Usage");

// VENDOR ORDER AUTOMATION (UPGRADED)
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    // Load items
    const items = await Item.find().populate("vendorId").populate("categoryId");

    // Load inventory
    const inventory = await InventoryCount.find({ storeId });

    // Load usage for forecasting
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    const suggestions = {};

    // Build base item entries
    for (const item of items) {
      const inv = inventory.find(
        (i) => i.itemId.toString() === item._id.toString(),
      );
      const currentStock = inv ? inv.quantity : 0;

      const parEntry = item.parLevels?.find(
        (p) => p.storeId.toString() === storeId,
      );
      const par = parEntry ? parEntry.par : 0;

      suggestions[item._id] = {
        itemId: item._id,
        name: item.name,
        vendorId: item.vendorId?._id || null,
        vendorName: item.vendorId?.name || item.vendor || "Unknown Vendor",
        category: item.categoryId?.name || "Uncategorized",
        currentStock,
        parLevel: par,
        forecastUsageNext7Days: 0,
        recommendedOrderQty: 0,
        unitPrice: item.currentPrice || 0,
        totalCost: 0,
        urgency: "Normal",
      };
    }

    // Forecast usage
    for (const u of usageRecords) {
      const item = u.itemId;
      const daysAgo =
        (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysAgo <= 7 && suggestions[item._id]) {
        suggestions[item._id].forecastUsageNext7Days += u.quantity;
      }
    }

    // Calculate order qty + urgency + cost
    for (const id in suggestions) {
      const s = suggestions[id];

      const targetStock = s.parLevel + s.forecastUsageNext7Days;
      const needed = targetStock - s.currentStock;

      s.recommendedOrderQty = needed > 0 ? Math.ceil(needed) : 0;
      s.totalCost = Number((s.recommendedOrderQty * s.unitPrice).toFixed(2));

      if (s.currentStock < s.forecastUsageNext7Days * 0.5) {
        s.urgency = "Critical";
      } else if (s.currentStock < s.forecastUsageNext7Days) {
        s.urgency = "High";
      }
    }

    // Build purchase orders per vendor
    const purchaseOrders = {};

    for (const id in suggestions) {
      const s = suggestions[id];

      if (s.recommendedOrderQty <= 0) continue;

      const vendorKey = s.vendorId || s.vendorName;

      if (!purchaseOrders[vendorKey]) {
        purchaseOrders[vendorKey] = {
          vendorId: s.vendorId || null,
          vendorName: s.vendorName,
          storeId: store._id,
          storeName: store.name,
          createdAt: new Date(),
          lineItems: [],
          totalCost: 0,
        };
      }

      purchaseOrders[vendorKey].lineItems.push({
        itemId: s.itemId,
        name: s.name,
        category: s.category,
        currentStock: s.currentStock,
        parLevel: s.parLevel,
        forecastUsageNext7Days: s.forecastUsageNext7Days,
        orderQty: s.recommendedOrderQty,
        unitPrice: s.unitPrice,
        lineTotal: s.totalCost,
        urgency: s.urgency,
      });

      purchaseOrders[vendorKey].totalCost += s.totalCost;
    }

    // Round totals
    for (const key in purchaseOrders) {
      purchaseOrders[key].totalCost = Number(
        purchaseOrders[key].totalCost.toFixed(2),
      );
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      purchaseOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
