const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Adjustment = require("../../models/Adjustment");
const Item = require("../../models/Item");

// Print adjustment
router.get("/:id", async (req, res) => {
  try {
    const adj = await Adjustment.findById(req.params.id).populate("itemId");

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`Adjustment #${adj._id}`);
    doc.moveDown();

    doc.fontSize(12).text(`Item: ${adj.itemId.name}`);
    doc.text(`Store: ${adj.storeId}`);
    doc.text(`Amount: ${adj.amount}`);
    doc.text(`Reason: ${adj.reason}`);
    doc.text(`Date: ${adj.createdAt}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
