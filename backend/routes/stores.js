const express = require("express");
const router = express.Router();
const Store = require("../models/Store");

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

// Create store
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.storeNumber)
      throwError("Store name and storeNumber are required", 400);

    const store = await Store.create(req.body);
    res.json({ store, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// Get all stores
router.get("/", async (req, res, next) => {
  try {
    const stores = await Store.find();

    if (!stores.length) throwError("No stores found", 404);

    res.json({ stores, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
