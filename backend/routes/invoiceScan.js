const express = require("express");
const router = express.Router();

const multer = require("multer");
const Tesseract = require("tesseract.js");

const upload = multer({ dest: "uploads/" });
const { requireAuth } = require("../middleware/auth");

router.post(
  "/scan",
  upload.single("file"),
  requireAuth,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await Tesseract.recognize(req.file.path, "eng", {
        logger: (m) => console.log("OCR:", m),
      });

      const text = result.data.text;

      const vendorMatch = text.match(/^[A-Za-z0-9 .,&'-]+/m);
      const vendor = vendorMatch ? vendorMatch[0].trim() : "Unknown Vendor";

      const invoiceNumberMatch = text.match(/Invoice\s*#?\s*[:\-]?\s*(\S+)/i);
      const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : null;

      const dateMatch = text.match(
        /(Date|Invoice Date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      );
      const invoiceDate = dateMatch ? new Date(dateMatch[2]) : new Date();

      const lines = text.split("\n").map((l) => l.trim());

      const itemLines = lines.filter(
        (l) => /\b\d+\b/.test(l) && /\d+(\.\d{2})/.test(l),
      );

      const parsedItems = itemLines.map((line) => {
        const parts = line.split(/\s+/);

        const price = parseFloat(parts.pop());
        const quantity = parseInt(parts.pop());
        const name = parts.join(" ");

        return {
          name,
          quantityOrdered: quantity,
          price,
        };
      });

      res.json({
        parsed: {
          vendor,
          invoiceNumber,
          invoiceDate,
          items: parsedItems,
          rawText: text,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
