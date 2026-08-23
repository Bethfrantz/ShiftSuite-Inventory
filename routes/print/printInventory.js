const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");

const Item = require("../../models/Item");
const InventoryCount = require("../../models/InventoryCount");

// Print inventory sheet (no barcodes)
router.get("/inventory/:storeId", async (req, res) => {
  try {
    const items = await Item.find();
    const counts = await InventoryCount.find({ storeId: req.params.storeId });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`Inventory Sheet - Store ${req.params.storeId}`);
    doc.moveDown();

    items.forEach((item) => {
      const count = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );

      doc.fontSize(12).text(`Item: ${item.name}`);
      doc.text(`Vendor: ${item.vendor}`);
      doc.text(`Current Count: ${count ? count.count : 0}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Print inventory sheet WITH barcodes
router.get("/inventory-barcodes/:storeId", async (req, res) => {
  try {
    const items = await Item.find();
    const counts = await InventoryCount.find({ storeId: req.params.storeId });

    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    items.forEach((item) => {
      doc.addPage();
      doc.fontSize(20).text(item.name);
      doc.fontSize(12).text(`Vendor: ${item.vendor}`);

      const count = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      doc.text(`Current Count: ${count ? count.count : 0}`);

      if (item.barcode) {
        const png = bwipjs.toBuffer({
          bcid: "code128",
          text: item.barcode,
          scale: 3,
          height: 10,
        });

        doc.image(png, { width: 200 });
      } else {
        doc.text("No barcode available");
      }
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
