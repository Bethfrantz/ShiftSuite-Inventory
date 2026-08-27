const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const InventorySnapshot = require("../models/InventorySnapshot");
const items = await Item.find().populate("categoryId");

// Get all inventory items for a store (with par levels)
router.get("/items/:storeId", async (req, res) => {
  try {
    const items = await Item.find();

    const mapped = items.map((item) => {
      const par = item.parLevels.find(
        (p) => p.storeId.toString() === req.params.storeId,
      );

      return {
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        barcode: item.barcode,
        photoUrl: item.photoUrl,
        units: item.units,
        par: par ? par.par : 0,
        categoryPhotoUrl: item.categoryId.photoUrl,
      };
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit inventory counts
router.post("/counts/:storeId", async (req, res) => {
  try {
    const { counts } = req.body;

    await InventoryCount.deleteMany({ storeId: req.params.storeId });

    const created = await InventoryCount.insertMany(
      counts.map((c) => ({
        storeId: req.params.storeId,
        itemId: c.itemId,
        count: c.count,
        unitType: c.unitType,
      })),
    );

    res.json({ message: "Counts saved", created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest counts for a store
router.get("/counts/:storeId", async (req, res) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    }).populate("itemId");

    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create snapshot
router.post("/snapshot/:storeId", async (req, res) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    });

    const snapshot = await InventorySnapshot.create({
      storeId: req.params.storeId,
      items: counts.map((c) => ({
        itemId: c.itemId,
        count: c.count,
        unitType: c.unitType,
      })),
      createdAt: new Date(),
    });

    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all snapshots for a store
router.get("/snapshot/:storeId", async (req, res) => {
  try {
    const snapshots = await InventorySnapshot.find({
      storeId: req.params.storeId,
    });

    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single snapshot
router.get("/snapshot/:storeId/:snapshotId", async (req, res) => {
  try {
    const snapshot = await InventorySnapshot.findById(
      req.params.snapshotId,
    ).populate("items.itemId");

    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
