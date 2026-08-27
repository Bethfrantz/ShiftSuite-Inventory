const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const StoreReport = require("../../models/StoreReport");
const DistrictReport = require("../../models/DistrictReport");

// Print store report
router.get("/store/:storeId", async (req, res) => {
  try {
    const report = await StoreReport.findOne({ storeId: req.params.storeId });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`Store Report - ${report.storeName}`);
    doc.moveDown();

    doc.fontSize(12).text(`KPIs:`);
    doc.text(JSON.stringify(report.kpis, null, 2));
    doc.moveDown();

    doc.text(`Forecast:`);
    doc.text(JSON.stringify(report.forecast, null, 2));

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Print district report
router.get("/district/:districtId", async (req, res) => {
  try {
    const report = await DistrictReport.findOne({
      districtId: req.params.districtId,
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`District Report - ${report.districtName}`);
    doc.moveDown();

    doc.fontSize(12).text(`KPIs:`);
    doc.text(JSON.stringify(report.kpis, null, 2));
    doc.moveDown();

    doc.text(`Forecast:`);
    doc.text(JSON.stringify(report.forecast, null, 2));

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
