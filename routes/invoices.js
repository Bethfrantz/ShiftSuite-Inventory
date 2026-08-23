const express = require("express");
const router = express.Router();

const Invoice = require("../models/Invoice");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");

// Create invoice
router.post("/", async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Receive invoice → increase inventory counts
router.post("/:id/receive", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    for (const line of invoice.items) {
      const existing = await InventoryCount.findOne({
        storeId: invoice.storeId,
        itemId: line.itemId,
      });

      if (existing) {
        existing.count += line.quantity;
        await existing.save();
      } else {
        await InventoryCount.create({
          storeId: invoice.storeId,
          itemId: line.itemId,
          count: line.quantity,
          unitType: line.unitType,
        });
      }
    }

    res.json({ message: "Invoice received and inventory updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item prices from invoice
router.post("/:id/update-prices", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    for (const line of invoice.items) {
      const item = await Item.findById(line.itemId);

      item.priceHistory.push({
        price: line.price,
        date: new Date(),
      });

      item.currentPrice = line.price;
      await item.save();
    }

    res.json({ message: "Prices updated from invoice" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
