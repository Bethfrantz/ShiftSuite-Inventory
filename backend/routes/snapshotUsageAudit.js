const express = require("express");
const router = express.Router();
const InventorySnapshot = require("../models/InventorySnapshot");

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

// Calculate usage between two snapshots
router.get("/:storeId/:snapshotA/:snapshotB", async (req, res, next) => {
  try {
    const { storeId, snapshotA, snapshotB } = req.params;

    const snapA = await InventorySnapshot.findById(snapshotA).populate({
      path: "items.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    const snapB = await InventorySnapshot.findById(snapshotB).populate({
      path: "items.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    if (!snapA || !snapB) throwError("Snapshots not found", 404);

    if (!snapA.items.length || !snapB.items.length)
      throwError("Snapshots contain no items", 404);

    // Build usage list
    const usage = snapA.items.map((itemA) => {
      const itemB = snapB.items.find(
        (i) => i.itemId._id.toString() === itemA.itemId._id.toString(),
      );

      const qtyA = itemA.quantity;
      const qtyB = itemB ? itemB.quantity : 0;

      return {
        itemId: itemA.itemId._id,
        name: itemA.itemId.name,
        photoUrl: itemA.itemId.photoUrl,
        vendor: itemA.itemId.vendor,
        categoryId: itemA.itemId.categoryId,
        used: qtyA - qtyB,
      };
    });

    res.json({
      storeId,
      snapshotA,
      snapshotB,
      usage,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
