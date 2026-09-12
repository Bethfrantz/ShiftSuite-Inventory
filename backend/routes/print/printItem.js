const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");

const Item = require("../../models/Item");
const Store = require("../../models/Store");
const Category = require("../../models/Category");

// Print single item
router.get("/item/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("categoryId");

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(`Item: ${item.name}`);
    doc.moveDown();

    doc.fontSize(12).text(`Vendor: ${item.vendor || "N/A"}`);
    doc.text(`Category: ${item.categoryId?.name || "N/A"}`);
    doc.text(`Current Price: $${item.currentPrice.toFixed(2)}`);
    doc.moveDown();

    // Units
    doc.fontSize(14).text("Units");
    doc.fontSize(12).text(`Case Size: ${item.units.caseSize || "N/A"}`);
    doc.text(`Bag Size: ${item.units.bagSize || "N/A"}`);
    doc.text(`Cambro Size: ${item.units.cambroSize || "N/A"}`);
    doc.text(`Allow Cambros: ${item.units.allowCambros ? "Yes" : "No"}`);
    doc.text(`Allow Singles: ${item.units.allowSingles ? "Yes" : "No"}`);
    doc.moveDown();

    // Par Levels
    doc.fontSize(14).text("Par Levels");
    for (const par of item.parLevels) {
      const store = await Store.findById(par.storeId);
      doc.fontSize(12).text(`${store?.name || "Store"}: ${par.par}`);
    }
    doc.moveDown();

    // Barcode
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

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
