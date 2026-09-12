const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Invoice = require("../../models/Invoice");
const Vendor = require("../../models/Vendor");
const Store = require("../../models/Store");

// Print invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("vendor")
      .populate("store")
      .populate("items.item");

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(`Invoice #${invoice.invoiceNumber}`);
    doc.moveDown();

    doc.fontSize(12).text(`Vendor: ${invoice.vendor.name}`);
    doc.text(`Store: ${invoice.store.name} (#${invoice.store.storeNumber})`);
    doc.text(`Date: ${invoice.date.toLocaleDateString()}`);
    doc.moveDown();

    // Line items
    invoice.items.forEach((line) => {
      doc.fontSize(12).text(`Item: ${line.item.name}`);
      doc.text(`Vendor Item #: ${line.vendorItemNumber || "N/A"}`);
      doc.text(`Quantity: ${line.quantity}`);
      doc.text(`Unit Cost: $${line.unitCost.toFixed(2)}`);
      doc.text(`Line Total: $${line.totalCost.toFixed(2)}`);
      doc.moveDown();
    });

    // Totals
    doc.fontSize(14).text(`Subtotal: $${invoice.subtotal.toFixed(2)}`);
    doc.text(`Tax: $${invoice.tax.toFixed(2)}`);
    doc.text(`Total: $${invoice.total.toFixed(2)}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
