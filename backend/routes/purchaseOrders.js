const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({ storeId });
    const counts = await InventoryCount.find({ storeId });

    const latestCounts = {};
    counts.forEach((c) => {
      latestCounts[c.itemId] = c.count;
    });

    const purchaseOrders = {};

    items.forEach((item) => {
      const actual = latestCounts[item._id] || 0;

      const dailyUsage = item.dailyUsage || 0; // from your forecast
      const lead = item.deliveryLeadDays || 3;
      const safety = item.safetyStockDays || 2;

      const requiredUnits = dailyUsage * (lead + safety);
      const recommendedOrder = Math.max(requiredUnits - actual, 0);

      if (recommendedOrder <= 0) return;

      const vendorKey = item.vendor || "Unknown Vendor";

      if (!purchaseOrders[vendorKey]) {
        purchaseOrders[vendorKey] = {
          vendor: vendorKey,
          storeId,
          createdAt: new Date(),
          lineItems: [],
          totalCost: 0,
        };
      }

      const unitCost = item.unitCost || 0;
      const lineTotal = unitCost * recommendedOrder;

      purchaseOrders[vendorKey].lineItems.push({
        itemId: item._id,
        name: item.name,
        recommendedOrder,
        unitCost,
        lineTotal,
      });

      purchaseOrders[vendorKey].totalCost += lineTotal;
    });

    res.json({ purchaseOrders });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate purchase orders" });
  }
});

module.exports = router;
