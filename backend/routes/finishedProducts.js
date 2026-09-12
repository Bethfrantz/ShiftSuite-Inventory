const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");
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

// CREATE finished product
router.post("/", async (req, res, next) => {
  try {
    const { name, photoUrl, ingredients } = req.body;

    const product = await FinishedProduct.create({
      name,
      photoUrl,
      ingredients,
    });

    res.json(product);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// GET all finished products
router.get("/", async (req, res, next) => {
  try {
    const products =
      await FinishedProduct.find().populate("ingredients.itemId");
    res.json(products);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// GET single finished product
router.get("/:id", async (req, res, next) => {
  try {
    const product = await FinishedProduct.findById(req.params.id).populate(
      "ingredients.itemId",
    );

    if (!product) throwError("Finished product not found", 404);

    res.json(product);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// UPDATE finished product
router.put("/:id", async (req, res, next) => {
  try {
    const { name, photoUrl, ingredients, active } = req.body;

    const updated = await FinishedProduct.findByIdAndUpdate(
      req.params.id,
      { name, photoUrl, ingredients, active },
      { new: true },
    );

    res.json(updated);
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// DELETE finished product
router.delete("/:id", async (req, res, next) => {
  try {
    await FinishedProduct.findByIdAndDelete(req.params.id);
    res.json({ message: "Finished product deleted" });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

module.exports = router;
