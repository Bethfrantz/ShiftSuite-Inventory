const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const StoreReport = require("../../models/StoreReport");
const DistrictReport = require("../../models/DistrictReport");

// Print store report
router.get("/store/:storeId", async (req, res) => {
  try {
    const report = await StoreReport.findOne({
      store: req.params.storeId,
    }).populate("store");

    if (!report) {
      return res.status(404).json({ error: "Store report not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc
      .fontSize(20)
      .text(
        `Store Report - ${report.store.name} (#${report.store.storeNumber})`,
      );
    doc.moveDown();

    doc.fontSize(14).text("KPIs");
    Object.entries(report.kpis).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });
    doc.moveDown();

    doc.fontSize(14).text("Forecast");
    Object.entries(report.forecast).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });

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

    if (!report) {
      return res.status(404).json({ error: "District report not found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text(`District Report - ${report.districtName}`);
    doc.moveDown();

    doc.fontSize(14).text("KPIs");
    Object.entries(report.kpis).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });
    doc.moveDown();

    doc.fontSize(14).text("Forecast");
    Object.entries(report.forecast).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
