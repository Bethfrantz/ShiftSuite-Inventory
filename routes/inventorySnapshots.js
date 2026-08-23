const express = require("express");
const router = express.Router();
const InventorySnapshot = require("../models/InventorySnapshot");

// Create snapshot
router.post("/", async (req, res) => {
  try {
    const snapshot = await InventorySnapshot.create(req.body);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all snapshots
router.get("/", async (req, res) => {
  try {
    const snapshots = await InventorySnapshot.find()
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get snapshots for a store
router.get("/store/:storeId", async (req, res) => {
  try {
    const snapshots = await InventorySnapshot.find({
      storeId: req.params.storeId,
    }).populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single snapshot
router.get("/:id", async (req, res) => {
  try {
    const snapshot = await InventorySnapshot.findById(req.params.id)
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete snapshot
router.delete("/:id", async (req, res) => {
  try {
    await InventorySnapshot.findByIdAndDelete(req.params.id);
    res.json({ message: "Snapshot deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
