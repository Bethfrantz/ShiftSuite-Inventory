const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");

const Item = require("../../models/Item");
const InventoryCount = require("../../models/InventoryCount");
const Store = require("../../models/Store");

// Print inventory sheet WITH barcodes
router.get("/inventory-barcodes/:storeId", async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const items = await Item.find().sort({ name: 1 });
    const counts = await InventoryCount.find({ storeId: req.params.storeId });

    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    for (const item of items) {
      doc.addPage();

      doc.fontSize(20).text(item.name);
      doc.fontSize(12).text(`Vendor: ${item.vendor || "N/A"}`);

      const count = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );

      doc.text(`Current Count: ${count ? count.quantity : 0}`);

      if (item.barcode) {
        try {
          const png = await bwipjs.toBuffer({
            bcid: "code128",
            text: item.barcode,
            scale: 3,
            height: 10,
          });

          doc.image(png, { width: 200 });
        } catch (err) {
          doc.text("Error generating barcode");
        }
      } else {
        doc.text("No barcode available");
      }
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
