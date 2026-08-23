const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Invoice = require("../../models/Invoice");
const Item = require("../../models/Item");

// Print invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "items.itemId",
    );

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`Invoice #${invoice._id}`);
    doc.text(`Vendor: ${invoice.vendorName}`);
    doc.text(`Store: ${invoice.storeId}`);
    doc.moveDown();

    invoice.items.forEach((line) => {
      doc.fontSize(12).text(`Item: ${line.itemId.name}`);
      doc.text(`Quantity: ${line.quantity}`);
      doc.text(`Price: $${line.price}`);
      doc.moveDown();
    });

    doc.text(`Total: $${invoice.total}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
