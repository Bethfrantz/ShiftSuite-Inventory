const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Invoice = require("../models/Invoice");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");

router.get("/:storeId/:vendorName/report", async (req, res, next) => {
  try {
    const { storeId, vendorName } = req.params;

    // Pull analytics from your existing vendorAnalytics logic
    const vendorAnalytics = await fetchVendorAnalytics(storeId);

    const optimization = vendorAnalytics.vendorContractOptimization[vendorName];
    const risk = vendorAnalytics.vendorRiskScore[vendorName];
    const forecast = vendorAnalytics.vendorForecast[vendorName];
    const trend = vendorAnalytics.vendorCostTrend[vendorName];

    const report = `
Vendor Contract Optimization Report
Store: ${vendorAnalytics.store.name} (#${vendorAnalytics.store.storeNumber})
Vendor: ${vendorName}

----------------------------------------
RISK SCORE
----------------------------------------
Risk Score: ${risk}/100
Risk Level: ${
      risk >= 80 ? "High Risk" : risk >= 50 ? "Medium Risk" : "Low Risk"
    }

----------------------------------------
COST SUMMARY
----------------------------------------
Total Spend: $${optimization.totalCost.toFixed(2)}
Waste Percentage: ${optimization.wastePct}%
Forecasted 30-Day Cost Change: ${optimization.forecastChangePct}%

----------------------------------------
COST TREND (Recent Invoices)
----------------------------------------
${trend.map((t) => `${t.date}: $${t.total.toFixed(2)}`).join("\n")}

----------------------------------------
SUGGESTED ACTIONS
----------------------------------------
${optimization.suggestions.map((s) => `- ${s}`).join("\n")}

Generated: ${new Date().toLocaleString()}
`;

    res.setHeader("Content-Type", "text/plain");
    res.send(report);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
