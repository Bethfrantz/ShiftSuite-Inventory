const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

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

// Create item
router.post("/", async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    res.json({ item, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get all items
router.get("/", async (req, res, next) => {
  try {
    const items = await Item.find().populate({
      path: "categoryId",
      select: "name photoUrl color",
    });

    if (!items.length) throwError("No items found", 404);
    res.json({ items, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});
// Get item by barcode
router.get("/barcode/:code", async (req, res, next) => {
  try {
    const item = await Item.findOne({ barcode: req.params.code }).populate({
      path: "categoryId",
      select: "name photoUrl color",
    });

    if (!item)
      throwError(`Item with barcode ${req.params.code} not found`, 404);

    res.json({ item, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get single item
router.get("/:id", async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate({
      path: "categoryId",
      select: "name photoUrl color",
    });
    if (!item) throwError(`Item with ID ${req.params.id} not found`, 404);
    res.json({ item, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Update item
router.put("/:id", async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate({
      path: "categoryId",
      select: "name photoUrl color",
    });
    if (!item) throwError(`Item with ID ${req.params.id} not found`, 404);
    res.json({ item, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Delete item
router.delete("/:id", async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id).populate({
      path: "categoryId",
      select: "name photoUrl color",
    });
    if (!item) throwError(`Item with ID ${req.params.id} not found`, 404);
    res.json({ message: "Item deleted", requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

module.exports = router;
