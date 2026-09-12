const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Order = require("../../models/Order");
const Store = require("../../models/Store");
const Item = require("../../models/Item");

// Print vendor order
router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("storeId")
      .populate("items.itemId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(`Vendor Order`);
    doc
      .fontSize(12)
      .text(`Store: ${order.storeId.name} (#${order.storeId.storeNumber})`);
    doc.text(`Order ID: ${order._id}`);
    doc.moveDown();

    // Group items by vendor
    const vendorGroups = {};
    order.items.forEach((line) => {
      if (!vendorGroups[line.vendor]) vendorGroups[line.vendor] = [];
      vendorGroups[line.vendor].push(line);
    });

    // Print each vendor section
    for (const vendor of Object.keys(vendorGroups)) {
      doc.fontSize(16).text(`Vendor: ${vendor}`);
      doc.moveDown();

      vendorGroups[vendor].forEach((line) => {
        doc.fontSize(12).text(`Item: ${line.itemId.name}`);
        doc.text(`Par: ${line.par}`);
        doc.text(`Current Quantity: ${line.currentQuantity}`);
        doc.text(`Order Quantity: ${line.orderQuantity}`);
        doc.moveDown();
      });

      doc.moveDown();
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
