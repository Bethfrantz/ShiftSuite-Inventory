const express = require("express");
const router = express.Router();
const Usage = require("../models/Usage");

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

router.post("/", async (req, res, next) => {
  try {
    if (!req.body.storeId || !req.body.itemId || !req.body.quantity)
      throwError("storeId, itemId, and quantity are required", 400);

    const usage = await Usage.create(req.body);
    res.json({ usage, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
