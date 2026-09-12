const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");

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

// Create vendor
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.name) throwError("Vendor name is required", 400);
    const vendor = await Vendor.create(req.body);
    res.json({ vendor, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// Get all vendors
router.get("/", async (req, res, next) => {
  try {
    const vendors = await Vendor.find();
    res.json({ vendors, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// Get single vendor
router.get("/:id", async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) throwError("Vendor not found", 404);
    res.json({ vendor, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// Update vendor
router.put("/:id", async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vendor) throwError("Vendor not found", 404);
    res.json({ vendor, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// Delete vendor
router.delete("/:id", async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) throwError("Vendor not found", 404);
    res.json({ message: "Vendor deleted", requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
