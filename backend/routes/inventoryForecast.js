const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Waste = require("../models/Waste");

router.get("/:storeId/forecast", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({ storeId });
    const counts = await InventoryCount.find({ storeId });
    const waste = await Waste.find({ storeId });

    const latestCounts = {};
    counts.forEach((c) => {
      latestCounts[c.itemId] = c.quantity;
    });

    const forecast = [];

    items.forEach((item) => {
      const actual = latestCounts[item._id] || 0;

      // Last 30 days usage
      const usageRecords = counts.filter(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      const last30 = usageRecords.slice(-30).map((u) => u.count);
      const last7 = usageRecords.slice(-7).map((u) => u.count);

      const avg30 = last30.length
        ? last30.reduce((a, b) => a + b, 0) / last30.length
        : 0;
      const avg7 = last7.length
        ? last7.reduce((a, b) => a + b, 0) / last7.length
        : 0;

      // Trend factor
      const trend = avg7 > avg30 ? 1.15 : avg7 < avg30 ? 0.9 : 1.0;

      // Waste adjustment
      const itemWaste = waste.filter(
        (w) => w.rawItemId?.toString() === item._id.toString(),
      );
      const wasteQty = itemWaste.reduce((sum, w) => sum + w.quantity, 0);

      const dailyUsage = avg7 * trend + wasteQty * 0.1;

      const forecast7 = actual - dailyUsage * 7;
      const forecast30 = actual - dailyUsage * 30;

      forecast.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        actual,
        dailyUsage: Number(dailyUsage.toFixed(2)),
        forecast7: Number(forecast7.toFixed(2)),
        forecast30: Number(forecast30.toFixed(2)),
        barcodeImageUrl: item.barcodeImageUrl,
      });
    });

    res.json({ forecast });
  } catch (err) {
    res.status(500).json({ error: "Forecasting failed" });
  }
});

module.exports = router;
