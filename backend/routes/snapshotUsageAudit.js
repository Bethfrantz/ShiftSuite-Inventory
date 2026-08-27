const express = require("express");
const router = express.Router();
const InventorySnapshot = require("../models/InventorySnapshot");

// Calculate usage between two snapshots
router.get("/:storeId/:snapshotA/:snapshotB", async (req, res) => {
  try {
    const { storeId, snapshotA, snapshotB } = req.params;

    const snapA =
      await InventorySnapshot.findById(snapshotA).populate("items.itemId");
    const snapB =
      await InventorySnapshot.findById(snapshotB).populate("items.itemId");

    if (!snapA || !snapB) {
      return res.status(404).json({ error: "Snapshots not found" });
    }

    // Build usage list
    const usage = snapA.items.map((itemA) => {
      const itemB = snapB.items.find(
        (i) => i.itemId._id.toString() === itemA.itemId._id.toString(),
      );

      const qtyA = itemA.quantity;
      const qtyB = itemB ? itemB.quantity : 0;

      return {
        itemId: itemA.itemId._id,
        name: itemA.itemId.name,
        photoUrl: itemA.itemId.photoUrl,
        vendor: itemA.itemId.vendor,
        categoryId: itemA.itemId.categoryId,
        used: qtyA - qtyB,
      };
    });

    res.json({
      storeId,
      snapshotA,
      snapshotB,
      usage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
