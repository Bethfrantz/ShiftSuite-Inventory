const express = require("express");
const router = express.Router();
const InventoryCount = require("../models/InventoryCount");
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

// Create inventory count
router.post("/", async (req, res, next) => {
  try {
    const count = await InventoryCount.create(req.body);
    res.json(count);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get all counts
router.get("/", async (req, res, next) => {
  try {
    const counts = await InventoryCount.find()
      .populate("storeId")
      .populate("itemId");
    res.json(counts);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get counts for a specific store
router.get("/store/:storeId", async (req, res, next) => {
  try {
    const counts = await InventoryCount.find({
      storeId: req.params.storeId,
    }).populate("itemId");
    res.json(counts);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Update a count
router.put("/:id", async (req, res, next) => {
  try {
    const count = await InventoryCount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(count);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Delete a count
router.delete("/:id", async (req, res, next) => {
  try {
    await InventoryCount.findByIdAndDelete(req.params.id);
    res.json({ message: "Inventory count deleted" });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// FIXED — standalone route
router.get("/history/:storeId/:itemId", async (req, res, next) => {
  const { storeId, itemId } = req.params;
  const { start, end } = req.query;

  const counts = await InventoryCount.find({
    storeId,
    itemId,
    createdAt: { $gte: new Date(start), $lte: new Date(end) },
  })
    .populate({
      path: "itemId",
      populate: { path: "categoryId" },
    })
    .populate("storeId");

  const formatted = counts.map((c) => ({
    _id: c._id,
    itemName: c.itemId.name,
    itemPhotoUrl: c.itemId.photoUrl,
    categoryPhotoUrl: c.itemId.categoryId.photoUrl,
    quantity: c.count, // if your model uses count
    notes: c.notes,
    createdAt: c.createdAt,
  }));

  res.json(formatted);
});

module.exports = router;
