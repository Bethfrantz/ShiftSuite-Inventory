const express = require("express");
const router = express.Router();

const Adjustment = require("../models/Adjustment");
const InventoryCount = require("../models/InventoryCount");

// Create adjustment
router.post("/", async (req, res) => {
  try {
    const adj = await Adjustment.create(req.body);
    res.json(adj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get adjustments for a store
router.get("/store/:storeId", async (req, res) => {
  try {
    const adjustments = await Adjustment.find({
      storeId: req.params.storeId,
    });

    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get adjustments for an item
router.get("/item/:itemId", async (req, res) => {
  try {
    const adjustments = await Adjustment.find({
      itemId: req.params.itemId,
    });

    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply adjustment to inventory
router.post("/apply", async (req, res) => {
  try {
    const { storeId, itemId, amount } = req.body;

    const count = await InventoryCount.findOne({ storeId, itemId });

    if (!count) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    count.count += amount;
    await count.save();

    res.json({ message: "Adjustment applied", count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
