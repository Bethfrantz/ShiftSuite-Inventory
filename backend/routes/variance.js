const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount"); // your count history model

router.get("/:storeId/variance", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({ storeId });
    const counts = await InventoryCount.find({ storeId });

    const latestCounts = {};
    counts.forEach((c) => {
      latestCounts[c.itemId] = c.count;
    });

    const variance = items.map((item) => {
      const actual = latestCounts[item._id] || 0;
      const par = item.par || 0;
      const last = item.lastCount || 0;

      const parVariance = actual - par;
      const lastVariance = actual - last;

      return {
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        par,
        actual,
        last,
        parVariance,
        lastVariance,
        barcodeImageUrl: item.barcodeImageUrl,
      };
    });

    res.json({ variance });
  } catch (err) {
    res.status(500).json({ error: "Variance report failed" });
  }
});

module.exports = router;
