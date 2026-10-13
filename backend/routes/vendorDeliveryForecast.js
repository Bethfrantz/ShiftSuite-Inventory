const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

router.get("/:storeId/vendorForecast", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({ storeId });
    const counts = await InventoryCount.find({ storeId });

    const latestCounts = {};
    counts.forEach((c) => {
      latestCounts[c.itemId] = c.count;
    });

    const forecast = [];

    items.forEach((item) => {
      const actual = latestCounts[item._id] || 0;

      // Assume these fields exist on Item:
      // vendor, deliveryLeadDays, safetyStockDays
      const deliveryLeadDays = item.deliveryLeadDays || 3; // days between trucks
      const safetyStockDays = item.safetyStockDays || 2; // buffer

      const usageRecords = counts.filter(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      const last7 = usageRecords.slice(-7).map((u) => u.count);
      const avg7 = last7.length
        ? last7.reduce((a, b) => a + b, 0) / last7.length
        : 0;

      const dailyUsage = avg7 || 0;

      const daysToCover = deliveryLeadDays + safetyStockDays;
      const requiredUnits = dailyUsage * daysToCover;

      const recommendedOrder = Math.max(requiredUnits - actual, 0);

      forecast.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        deliveryLeadDays,
        safetyStockDays,
        dailyUsage: Number(dailyUsage.toFixed(2)),
        currentOnHand: actual,
        requiredUnits: Number(requiredUnits.toFixed(2)),
        recommendedOrder: Number(recommendedOrder.toFixed(2)),
      });
    });

    res.json({ forecast });
  } catch (err) {
    res.status(500).json({ error: "Vendor delivery forecasting failed" });
  }
});

module.exports = router;
