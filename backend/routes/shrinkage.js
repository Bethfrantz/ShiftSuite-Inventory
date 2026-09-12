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

// Shrinkage detection between two snapshots
router.post("/:storeId/:snapshotA/:snapshotB", async (req, res, next) => {
  try {
    const { storeId, snapshotA, snapshotB } = req.params;
    const { expectedUsage } = req.body; // { itemId: number }

    if (!expectedUsage || typeof expectedUsage !== "object")
      throwError("Expected usage must be provided as an object", 400);

    const snapA = await InventorySnapshot.findById(snapshotA).populate({
      path: "items.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    const snapB = await InventorySnapshot.findById(snapshotB).populate({
      path: "items.itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    if (!snapA || !snapB) throwError("One or both snapshots not found", 404);

    if (!snapA.items.length || !snapB.items.length)
      throwError("Snapshots contain no items", 404);

    const shrinkage = snapA.items.map((itemA) => {
      const itemB = snapB.items.find(
        (i) => i.itemId._id.toString() === itemA.itemId._id.toString(),
      );

      const qtyA = itemA.quantity;
      const qtyB = itemB ? itemB.quantity : 0;

      const actualUsed = qtyA - qtyB;
      const expected = expectedUsage[itemA.itemId._id] || 0;

      return {
        itemId: itemA.itemId._id,
        name: itemA.itemId.name,
        photoUrl: itemA.itemId.photoUrl,
        actualUsed,
        expectedUsed: expected,
        shrinkage: expected - actualUsed,
      };
    });

    res.json({
      storeId,
      snapshotA,
      snapshotB,
      shrinkage,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
