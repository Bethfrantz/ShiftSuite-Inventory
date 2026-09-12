const express = require("express");
const router = express.Router();

const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
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

// Get all inventory items for a store (with par levels)
router.get("/items/:storeId", async (req, res, next) => {
  try {
    const items = await Item.find().populate({
      path: "categoryId",
      select: "name photoUrl color",
    });

    if (!items) throwError("No items found", 404);

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

    res.json({ mapped, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Submit inventory counts
router.post("/counts/:storeId", async (req, res, next) => {
  try {
    const { counts } = req.body;

    await InventoryCount.deleteMany({ storeId: req.params.storeId });

    const created = await InventoryCount.insertMany(
      counts.map((c) => ({
        storeId: req.params.storeId,
        itemId: c.itemId,
        quantity: c.quantity,
        notes: c.notes,
      })),
    );

    res.json({ message: "Counts saved", created, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get latest counts for a store
router.get("/counts/:storeId", async (req, res, next) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    }).populate("itemId");

    res.json({ counts, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Create snapshot
router.post("/snapshot/:storeId", async (req, res, next) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    });

    const snapshot = await InventorySnapshot.create({
      storeId: req.params.storeId,
      items: counts.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
      })),
      createdAt: new Date(),
    });

    res.json({ snapshot, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get all snapshots for a store
router.get("/snapshot/:storeId", async (req, res, next) => {
  try {
    const snapshots = await InventorySnapshot.find({
      storeId: req.params.storeId,
    });

    res.json({ snapshots, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get single snapshot
router.get("/snapshot/:storeId/:snapshotId", async (req, res, next) => {
  try {
    const snapshot = await InventorySnapshot.findById(
      req.params.snapshotId,
    ).populate("items.itemId");

    if (!snapshot) throwError("Snapshot not found", 404);

    res.json({ snapshot, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

module.exports = router;
