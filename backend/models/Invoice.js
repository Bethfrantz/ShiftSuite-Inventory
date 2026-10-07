const mongoose = require("mongoose");

const InvoiceItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },

  vendorItemNumber: {
    type: String,
    default: "",
  },

  quantity: {
    type: Number,
    required: true,
  },

  unitCost: {
    type: Number,
    required: true,
  },

  totalCost: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },

  invoiceNumber: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  items: [InvoiceItemSchema],

  subtotal: {
    type: Number,
    required: true,
  },

  tax: {
    type: Number,
    default: 0,
  },

  total: {
    type: Number,
    required: true,
  },

  received: {
    type: Boolean,
    default: false,
  },

  receivedAt: {
    type: Date,
  },
});
/* -------------------------------------------------------
   OCR SCANNING ROUTE
   POST /invoices/scan
------------------------------------------------------- */
const multer = require("multer");
const Tesseract = require("tesseract.js");
const upload = multer({ dest: "uploads/" });

router.post("/scan", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throwError("No file uploaded", 400);

    // Run OCR on the uploaded file
    const result = await Tesseract.recognize(req.file.path, "eng", {
      logger: (m) => console.log("OCR:", m),
    });

    const text = result.data.text;

    /* -------------------------------------------------------
       BASIC INVOICE PARSER
       (Vendor, Invoice #, Date, Line Items)
    ------------------------------------------------------- */

    // Extract vendor (first line with letters)
    const vendorMatch = text.match(/^[A-Za-z0-9 .,&'-]+/m);
    const vendor = vendorMatch ? vendorMatch[0].trim() : "Unknown Vendor";

    // Extract invoice number
    const invoiceNumberMatch = text.match(/Invoice\s*#?\s*[:\-]?\s*(\S+)/i);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : null;

    // Extract date
    const dateMatch = text.match(
      /(Date|Invoice Date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    const invoiceDate = dateMatch ? new Date(dateMatch[2]) : new Date();

    /* -------------------------------------------------------
       LINE ITEM PARSER
       Format expected:
       ItemName   Qty   Price
       Bagels     12    3.49
       Croissants 6     4.29
    ------------------------------------------------------- */

    const lines = text.split("\n").map((l) => l.trim());

    const itemLines = lines.filter(
      (l) => /\b\d+\b/.test(l) && /\d+(\.\d{2})/.test(l),
    );

    const parsedItems = itemLines.map((line) => {
      const parts = line.split(/\s+/);

      // Last two tokens are quantity + price
      const price = parseFloat(parts.pop());
      const quantity = parseInt(parts.pop());
      const name = parts.join(" ");

      return {
        name,
        quantityOrdered: quantity,
        price,
      };
    });

    /* -------------------------------------------------------
       OCR RESULT OBJECT
    ------------------------------------------------------- */
    const ocrInvoice = {
      vendor,
      invoiceNumber,
      invoiceDate,
      items: parsedItems,
      rawText: text,
    };

    res.json({
      requestId: req.requestId,
      parsed: ocrInvoice,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
