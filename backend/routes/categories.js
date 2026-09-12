const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

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

// Create category
router.post("/", async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Get all categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Get single category
router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Update category
router.put("/:id", async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Delete category
router.delete("/:id", async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
