const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Adjustment = require("../../models/Adjustment");
const Item = require("../../models/Item");
const Store = require("../../models/Store");

// Print adjustment
router.get("/:id", async (req, res) => {
  try {
    const adj = await Adjustment.findById(req.params.id)
      .populate("item")
      .populate("store");

    if (!adj) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`Adjustment #${adj._id}`);
    doc.moveDown();

    doc.fontSize(12).text(`Item: ${adj.item.name}`);
    doc.text(`Store: ${adj.store.name} (#${adj.store.storeNumber})`);
    doc.text(`Quantity Change: ${adj.quantityChange}`);
    doc.text(`Reason: ${adj.reason}`);
    doc.text(`Notes: ${adj.notes || "None"}`);
    doc.text(`Date: ${adj.createdAt.toLocaleString()}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
