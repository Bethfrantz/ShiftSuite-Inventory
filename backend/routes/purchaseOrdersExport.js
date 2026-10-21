const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const { requireAuth } = require("../middleware/auth");

// -----------------------------
// PDF EXPORT (PUPPETEER)
// -----------------------------
router.post("/pdf", requireAuth, async (req, res) => {
  const { purchaseOrders } = req.body;

  let html = "<h1>Vendor Purchase Orders</h1>";

  Object.keys(purchaseOrders).forEach((vendor) => {
    const po = purchaseOrders[vendor];

    html += `<h2>${vendor}</h2>`;
    html += `<p>Total Cost: $${po.totalCost.toFixed(2)}</p>`;
    html +=
      "<table border='1' cellpadding='6'><tr><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr>";

    po.lineItems.forEach((li) => {
      html += `<tr>
        <td>${li.name}</td>
        <td>${li.recommendedOrder}</td>
        <td>$${li.unitCost}</td>
        <td>$${li.lineTotal.toFixed(2)}</td>
      </tr>`;
    });

    html += "</table><br/>";
  });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=purchase_orders.pdf",
  );
  res.send(pdfBuffer);
});

// -----------------------------
// CSV EXPORT
// -----------------------------
router.post("/csv", requireAuth, (req, res) => {
  const { purchaseOrders } = req.body;

  let csv = "Vendor,Item,OrderQty,UnitCost,LineTotal\n";

  Object.keys(purchaseOrders).forEach((vendor) => {
    purchaseOrders[vendor].lineItems.forEach((li) => {
      csv += `${vendor},${li.name},${li.recommendedOrder},${li.unitCost},${li.lineTotal}\n`;
    });
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=purchase_orders.csv",
  );
  res.send(csv);
});

module.exports = router;
