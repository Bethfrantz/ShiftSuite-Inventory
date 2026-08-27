const express = require("express");
const router = express.Router();
const Store = require("../models/Store");

// Create store
router.post("/", async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
