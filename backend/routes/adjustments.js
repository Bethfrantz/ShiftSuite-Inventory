const express = require("express");
const router = express.Router();

const Adjustment = require("../models/Adjustment");
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

/* -------------------------------------------------------
   Create adjustment
------------------------------------------------------- */
router.post("/", async (req, res, next) => {
  try {
    const adj = await Adjustment.create(req.body);
    res.json(adj);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

/* -------------------------------------------------------
   Get adjustments for a store
------------------------------------------------------- */
router.get("/store/:storeId", async (req, res, next) => {
  try {
    const adjustments = await Adjustment.find({
      storeId: req.params.storeId,
    })
      .populate("item")
      .populate("store");

    res.json(adjustments);
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------
   Get adjustments for an item
------------------------------------------------------- */
router.get("/item/:itemId", async (req, res, next) => {
  try {
    const adjustments = await Adjustment.find({
      item: req.params.itemId,
    })
      .populate("item")
      .populate("store");

    res.json(adjustments);
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------
   Apply adjustment to inventory
------------------------------------------------------- */
router.post("/apply", async (req, res, next) => {
  try {
    const { store, item, quantityChange } = req.body;

    const count = await InventoryCount.findOne({
      storeId: store,
      itemId: item,
    });

    if (!count) throwError("Item not found in inventory", 404);

    count.quantity += quantityChange;
    await count.save();

    res.json({
      message: "Adjustment applied",
      count,
      requestId: req.requestId, // helpful for debugging
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
