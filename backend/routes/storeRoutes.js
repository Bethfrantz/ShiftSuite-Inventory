const express = require("express");
const Store = require("../models/Store");
const router = express.Router();

// GET all stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find({});
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "Failed to load stores" });
  }
});

module.exports = router;
