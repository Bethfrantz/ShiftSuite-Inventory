const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const Item = require("../models/Item");
const FinishedProduct = require("../models/FinishedProduct");
const Invoice = require("../models/Invoice");

/* -------------------------------------------------------
   VENDOR contract optimization
------------------------------------------------------- */
function buildVendorContractOptimization(
  vendorData,
  vendorCostTrend,
  vendorForecast,
  vendorRiskScore,
) {
  const optimization = {};

  for (const vendor in vendorData) {
    const data = vendorData[vendor];
    const trend = vendorCostTrend[vendor] || [];
    const forecast = vendorForecast[vendor] || { "7d": 0, "30d": 0 };
    const risk = vendorRiskScore[vendor] || 0;

    const totalCost = data.cost;
    const totalUsage = data.usage;
    const totalWaste = data.waste;
    const wastePct = totalUsage ? (totalWaste / totalUsage) * 100 : 0;

    const lastCost = trend.length ? trend[trend.length - 1].total : 0;
    const next30 = forecast["30d"];
    const forecastChangePct = lastCost
      ? ((next30 - lastCost) / lastCost) * 100
      : 0;

    const suggestions = [];

    if (risk >= 80) {
      suggestions.push(
        "High risk vendor — consider renegotiating or reducing dependency.",
      );
    } else if (risk >= 50) {
      suggestions.push(
        "Medium risk vendor — monitor closely and review pricing clauses.",
      );
    } else {
      suggestions.push(
        "Low risk vendor — generally stable, maintain relationship.",
      );
    }

    if (wastePct >= 15) {
      suggestions.push(
        "High waste percentage — tighten ordering quantities or adjust par levels.",
      );
    }

    if (forecastChangePct >= 10) {
      suggestions.push(
        "Forecasted cost increase — consider locking in pricing or exploring alternatives.",
      );
    }

    if (totalCost >= 5000) {
      suggestions.push(
        "High total spend — prioritize this vendor for contract review and volume discounts.",
      );
    }

    optimization[vendor] = {
      totalCost,
      wastePct: Number(wastePct.toFixed(1)),
      forecastChangePct: Number(forecastChangePct.toFixed(1)),
      risk,
      suggestions,
    };
  }

  return optimization;
}

/* -------------------------------------------------------
   venor risk score
------------------------------------------------------- */
function exponentialSmooth(values, alpha = 0.5) {
  if (!values?.length) return 0;

  let smoothed = values[0];

  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }

  return Math.round(smoothed);
}

function forecastVendorCosts(costTrend) {
  const totals = costTrend.map((row) => row.total);

  return {
    "7d": exponentialSmooth(totals, 0.6),
    "30d": exponentialSmooth(totals, 0.4),
  };
}
const vendorContractOptimization = buildVendorContractOptimization(
  vendorData,
  vendorCostTrend,
  vendorForecast,
  vendorRiskScore,
  vendorContractOptimization,
);

// -------------------------------------------------------------
// PRICE VOLATILITY (0–40 points)
// -------------------------------------------------------------
function calculateVolatility(costTrend) {
  if (!costTrend || costTrend.length < 2) return 0;

  const prices = costTrend.map((c) => c.total);
  const diffs = [];

  for (let i = 1; i < prices.length; i++) {
    const pct = Math.abs((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
    diffs.push(pct);
  }

  const avgVolatility = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  // Higher volatility = higher risk
  return Math.min(40, avgVolatility);
}

// -------------------------------------------------------------
// COST SPIKES (0–30 points)
// -------------------------------------------------------------
function calculateCostSpikes(costTrend) {
  if (!costTrend || costTrend.length < 2) return 0;

  let spikes = 0;

  for (let i = 1; i < costTrend.length; i++) {
    const prev = costTrend[i - 1].total;
    const curr = costTrend[i].total;

    if (prev > 0 && (curr - prev) / prev >= 0.25) {
      spikes++;
    }
  }

  return Math.min(30, spikes * 10); // each spike = +10 risk
}

// -------------------------------------------------------------
// RELIABILITY (0–20 points)
// -------------------------------------------------------------
function calculateReliability(vendorUsageCost) {
  // High waste or inconsistent usage increases risk
  const { usage, waste } = vendorUsageCost;

  if (usage === 0) return 20; // no usage = unknown vendor = high risk

  const wastePct = (waste / usage) * 100;

  return Math.min(20, wastePct); // 20% waste = max reliability risk
}

// -------------------------------------------------------------
// FORECAST DEVIATION (0–10 points)
// -------------------------------------------------------------
function calculateForecastDeviation(costTrend, forecast) {
  if (!costTrend || costTrend.length === 0) return 0;

  const last = costTrend[costTrend.length - 1].total;
  const next7 = forecast["7d"];

  const pct = Math.abs((next7 - last) / last) * 100;

  return Math.min(10, pct);
}

// -------------------------------------------------------------
// FINAL RISK SCORE (0–100)
// -------------------------------------------------------------
function buildVendorRiskScore(costTrend, vendorUsageCost, forecast) {
  const volatility = calculateVolatility(costTrend);
  const spikes = calculateCostSpikes(costTrend);
  const reliability = calculateReliability(vendorUsageCost);
  const forecastDeviation = calculateForecastDeviation(costTrend, forecast);

  const totalRisk = volatility + spikes + reliability + forecastDeviation;

  return Math.min(100, Math.round(totalRisk));
}

/* -------------------------------------------------------
   Helper: Throw formatted errors
------------------------------------------------------- */
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

/* -------------------------------------------------------
   Middleware: Attach Request ID (Step 5)
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging (Step 6)
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

// VENDOR ANALYTICS
router.get("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    const store = await Store.findById(storeId);
    if (!store) throwError("Store not found", 404);

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate({
      path: "itemId",
      populate: { path: "categoryId", select: "name photoUrl color" },
    });

    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        populate: { path: "categoryId", select: "name photoUrl color" },
      })
      .populate({
        path: "finishedProductId",
        populate: { path: "categoryId", select: "name photoUrl color" },
      });

    if (!usageRecords.length && !wasteRecords.length)
      throwError(
        "No usage or waste records found for the specified date range",
        404,
      );

    const finishedProducts = await FinishedProduct.find().populate({
      path: "ingredients.itemId",
      select: "name photoUrl color",
    });
    if (!finishedProducts.length) throwError("No finished products found", 404);

    const vendorData = {}; // vendor → { usage, waste, cost, items }

    // USAGE ANALYTICS
    for (const u of usageRecords) {
      const item = u.itemId;
      const vendor = item.vendor?.trim() || "Unknown Vendor";

      if (!vendorData[vendor]) {
        vendorData[vendor] = {
          usage: 0,
          waste: 0,
          cost: 0,
          items: [],
        };
      }

      vendorData[vendor].usage += u.quantity;
      vendorData[vendor].cost += u.quantity * item.currentPrice;

      vendorData[vendor].items.push({
        itemId: item._id,
        name: item.name,
        quantity: u.quantity,
        currentPrice: item.currentPrice,
        categoryId: item.categoryId,
      });
    }

    // WASTE ANALYTICS
    for (const w of wasteRecords) {
      // RAW WASTE
      if (w.type === "raw") {
        const item = w.rawItemId;
        const vendor = item.vendor?.trim() || "Unknown Vendor";

        if (!vendorData[vendor]) {
          vendorData[vendor] = {
            usage: 0,
            waste: 0,
            cost: 0,
            items: [],
          };
        }

        const cost = item.currentPrice * w.quantity;

        vendorData[vendor].waste += w.quantity;
        vendorData[vendor].cost += cost;
      }

      // FINISHED PRODUCT WASTE
      if (w.type === "finished") {
        const finished = await FinishedProduct.findById(
          w.finishedProductId,
        ).populate("ingredients.itemId");

        for (const ing of finished.ingredients) {
          const item = ing.itemId;
          const vendor = item.vendor?.trim() || "Unknown Vendor";

          if (!vendorData[vendor]) {
            vendorData[vendor] = {
              usage: 0,
              waste: 0,
              cost: 0,
              items: [],
            };
          }

          const quantityUsed = ing.quantityUsed * w.quantity;
          const cost = item.currentPrice * quantityUsed;

          vendorData[vendor].waste += quantityUsed;
          vendorData[vendor].cost += cost;
        }
      }
    }
    /* -------------------------------------------------------
   VENDOR COST TREND (Invoice-based)
------------------------------------------------------- */
    const invoices = await Invoice.find({ storeId }).populate("items.itemId");

    const vendorCostTrend = {}; // vendor → [{ date, total }]

    for (const inv of invoices) {
      const vendor = inv.vendorName?.trim() || "Unknown Vendor";
      const date = inv.invoiceDate
        ? inv.invoiceDate.toISOString().split("T")[0]
        : "Unknown";

      const total = inv.items.reduce(
        (sum, line) => sum + line.price * line.quantityOrdered,
        0,
      );

      if (!vendorCostTrend[vendor]) vendorCostTrend[vendor] = [];

      vendorCostTrend[vendor].push({ date, total });
    }
    /* -------------------------------------------------------
   VENDOR FORECASTING
------------------------------------------------------- */
    const vendorForecast = {};

    for (const vendor in vendorCostTrend) {
      vendorForecast[vendor] = forecastVendorCosts(vendorCostTrend[vendor]);
    }
    /* -------------------------------------------------------
   VENDOR RISK SCORE
------------------------------------------------------- */
    const vendorRiskScore = {};

    for (const vendor in vendorCostTrend) {
      const costTrend = vendorCostTrend[vendor];
      const usageCost = vendorData[vendor] || { usage: 0, waste: 0 };
      const forecast = vendorForecast[vendor];

      vendorRiskScore[vendor] = buildVendorRiskScore(
        costTrend,
        usageCost,
        forecast,
      );
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      vendors: vendorData,
      vendorCostTrend,
      vendorForecast,
      vendorRiskScore,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
