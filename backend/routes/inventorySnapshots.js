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

// Create snapshot
router.post("/", async (req, res, next) => {
  try {
    const snapshot = await InventorySnapshot.create(req.body);
    res.json(snapshot);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get all snapshots
router.get("/", async (req, res, next) => {
  try {
    const snapshots = await InventorySnapshot.find()
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get snapshots for a store
router.get("/store/:storeId", async (req, res, next) => {
  try {
    const snapshots = await InventorySnapshot.find({
      storeId: req.params.storeId,
    }).populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get single snapshot
router.get("/:id", async (req, res, next) => {
  try {
    const snapshot = await InventorySnapshot.findById(req.params.id)
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshot);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Delete snapshot
router.delete("/:id", async (req, res, next) => {
  try {
    await InventorySnapshot.findByIdAndDelete(req.params.id);
    res.json({ message: "Snapshot deleted", requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

module.exports = router;
