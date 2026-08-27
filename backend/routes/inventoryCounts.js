const express = require("express");
const router = express.Router();
const InventoryCount = require("../models/InventoryCount");

// Create inventory count
router.post("/", async (req, res) => {
  try {
    const count = await InventoryCount.create(req.body);
    res.json(count);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all counts
router.get("/", async (req, res) => {
  try {
    const counts = await InventoryCount.find()
      .populate("storeId")
      .populate("itemId");
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get counts for a specific store
router.get("/store/:storeId", async (req, res) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    }).populate("itemId");
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a count
router.put("/:id", async (req, res) => {
  try {
    const count = await InventoryCount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(count);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a count
router.delete("/:id", async (req, res) => {
  try {
    await InventoryCount.findByIdAndDelete(req.params.id);
    res.json({ message: "Inventory count deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  router.get("/history/:storeId/:itemId", async (req, res) => {
    const { storeId, itemId } = req.params;
    const { start, end } = req.query;

    const counts = await InventoryCount.find({
      storeId,
      itemId,
      createdAt: { $gte: new Date(start), $lte: new Date(end) },
    })
      .populate("itemId")
      .populate("storeId");

    const formatted = counts.map((c) => ({
      _id: c._id,
      itemName: c.itemId.name,
      itemPhotoUrl: c.itemId.photoUrl,
      categoryPhotoUrl: c.itemId.categoryId.photoUrl,
      quantity: c.quantity,
      notes: c.notes,
      createdAt: c.createdAt,
    }));

    res.json(formatted);
  });
});

module.exports = router;
