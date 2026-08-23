const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");

// Create vendor
router.post("/", async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single vendor
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vendor
router.put("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete vendor
router.delete("/:id", async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
