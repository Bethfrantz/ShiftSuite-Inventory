const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Waste = require("../models/Waste");

router.get("/:storeId/anomalies", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({ storeId });
    const counts = await InventoryCount.find({ storeId });
    const waste = await Waste.find({ storeId });

    const latestCounts = {};
    counts.forEach((c) => {
      latestCounts[c.itemId] = c.count;
    });

    const anomalies = [];

    items.forEach((item) => {
      const actual = latestCounts[item._id] || 0;
      const par = item.par || 0;
      const last = item.lastCount || 0;

      const shrinkPct = last ? ((actual - last) / last) * 100 : 0;
      const overstockPct = par ? ((actual - par) / par) * 100 : 0;

      const itemWaste = waste.filter(
        (w) => w.rawItemId?.toString() === item._id.toString(),
      );
      const wasteQty = itemWaste.reduce((sum, w) => sum + w.quantity, 0);

      const anomalyList = [];

      if (shrinkPct <= -20) {
        anomalyList.push({
          type: "Shrinkage",
          detail: `Count dropped ${Math.abs(shrinkPct).toFixed(1)}% since last inventory.`,
          severity: "high",
        });
      }

      if (overstockPct >= 30) {
        anomalyList.push({
          type: "Overstock",
          detail: `Count is ${overstockPct.toFixed(1)}% above PAR.`,
          severity: "medium",
        });
      }

      if (wasteQty > 0 && actual > last) {
        anomalyList.push({
          type: "Waste Mismatch",
          detail: `Waste recorded but inventory increased.`,
          severity: "high",
        });
      }

      if (anomalyList.length > 0) {
        anomalies.push({
          itemId: item._id,
          name: item.name,
          vendor: item.vendor,
          anomalies: anomalyList,
        });
      }
    });

    res.json({ anomalies });
  } catch (err) {
    res.status(500).json({ error: "Anomaly detection failed" });
  }
});

module.exports = router;
