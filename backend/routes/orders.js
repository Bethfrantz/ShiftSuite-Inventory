const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Order = require("../models/Order");

/* -------------------------------------------------------
   Helper: Throw formatted errors
------------------------------------------------------- */
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

/* -------------------------------------------------------
   Middleware: Attach Request ID (Step 5)
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging (Step 6)
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

// Generate order for a store
router.post("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;

    // Get all items
    const items = await Item.find().populate({
      path: "categoryId",
      select: "name photoUrl color",
    });
    if (!items.length) throwError("No items found", 404);

    // Get inventory counts for this store
    const counts = await InventoryCount.find({ storeId });
    if (!counts.length)
      throwError("No inventory counts found for this store", 404);

    const orderItems = items.map((item) => {
      // Find par level for this store
      const parEntry = item.parLevels.find(
        (p) => p.storeId?.toString() === storeId,
      );
      if (!parEntry) throwError(`Par level missing for item ${item.name}`, 404);

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

    res.json({ order, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
