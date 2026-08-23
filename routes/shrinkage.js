const express = require("express");
const router = express.Router();
const InventorySnapshot = require("../models/InventorySnapshot");

// Shrinkage detection between two snapshots
router.post("/:storeId/:snapshotA/:snapshotB", async (req, res) => {
  try {
    const { storeId, snapshotA, snapshotB } = req.params;
    const { expectedUsage } = req.body; // { itemId: number }

    const snapA =
      await InventorySnapshot.findById(snapshotA).populate("items.itemId");
    const snapB =
      await InventorySnapshot.findById(snapshotB).populate("items.itemId");

    if (!snapA || !snapB) {
      return res.status(404).json({ error: "Snapshots not found" });
    }

    const shrinkage = snapA.items.map((itemA) => {
      const itemB = snapB.items.find(
        (i) => i.itemId._id.toString() === itemA.itemId._id.toString(),
      );

      const qtyA = itemA.quantity;
      const qtyB = itemB ? itemB.quantity : 0;

      const actualUsed = qtyA - qtyB;
      const expected = expectedUsage[itemA.itemId._id] || 0;

      return {
        itemId: itemA.itemId._id,
        name: itemA.itemId.name,
        photoUrl: itemA.itemId.photoUrl,
        actualUsed,
        expectedUsed: expected,
        shrinkage: expected - actualUsed,
      };
    });

    res.json({
      storeId,
      snapshotA,
      snapshotB,
      shrinkage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
