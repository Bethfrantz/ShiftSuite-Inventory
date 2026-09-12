const express = require("express");
const router = express.Router();

const Invoice = require("../models/Invoice");
const Item = require("../models/Item");
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

// Create invoice
router.post("/", async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.json({ invoice, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get all invoices
router.get("/", async (req, res, next) => {
  try {
    const invoices = await Invoice.find().populate("items.itemId");
    res.json({ invoices, requestId: req.requestId });
  } catch (err) {
    next(err); // Step 3: Send errors to global handler
  }
});

// Get single invoice
router.get("/:id", async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "items.itemId",
      populate: { path: "categoryId" },
    });

    if (!invoice) throwError("Invoice not found", 404);

    res.json({
      invoice,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

// Receive invoice → increase inventory counts
router.post("/:id/receive", async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) throwError("Invoice not found", 404);

    for (const line of invoice.items) {
      const existing = await InventoryCount.findOne({
        storeId: invoice.storeId,
        itemId: line.itemId,
      });

      if (existing) {
        existing.quantity += line.quantityOrdered;
        await existing.save();
      } else {
        await InventoryCount.create({
          storeId: invoice.storeId,
          itemId: line.itemId,
          quantity: line.quantityOrdered,
        });
      }
    }

    res.json({
      message: "Invoice received and inventory updated",
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

// Update item prices from invoice
router.post("/:id/update-prices", async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) throwError("Invoice not found", 404);

    for (const line of invoice.items) {
      const item = await Item.findById(line.itemId);

      item.priceHistory.push({
        price: line.price,
        date: new Date(),
      });

      item.currentPrice = line.price;
      await item.save();
    }

    res.json({
      message: "Prices updated from invoice",
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
