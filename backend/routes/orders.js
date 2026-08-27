const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Order = require("../models/Order");

// Generate order for a store
router.post("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Get all items
    const items = await Item.find().populate("categoryId");

    // Get inventory counts for this store
    const counts = await InventoryCount.find({ storeId });

    const orderItems = items.map((item) => {
      // Find par level for this store
      const parEntry = item.parLevels.find(
        (p) => p.storeId?.toString() === storeId,
      );

      const par = parEntry ? parEntry.par : 0;

      // Find current count
      const countEntry = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      const currentQuantity = countEntry ? countEntry.quantity : 0;

      // Calculate order quantity
      const orderQuantity = Math.max(par - currentQuantity, 0);

      return {
        itemId: item._id,
        vendor: item.vendor,
        par,
        currentQuantity,
        orderQuantity,
      };
    });

    // Save order
    const order = await Order.create({
      storeId,
      items: orderItems,
      notes: req.body.notes || "",
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
