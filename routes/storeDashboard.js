const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");
const InventorySnapshot = require("../models/InventorySnapshot");

// axios used to call your other internal routes
const axios = require("axios");

// STORE PERFORMANCE DASHBOARD (ENHANCED)
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);

    const since14 = new Date();
    since14.setDate(since14.getDate() - 14);

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    // Historical usage
    const usage7 = await Usage.find({ storeId, createdAt: { $gte: since7 } });
    const usage14 = await Usage.find({ storeId, createdAt: { $gte: since14 } });
    const usage30 = await Usage.find({ storeId, createdAt: { $gte: since30 } });

    // Historical waste
    const waste7 = await Waste.find({ storeId, createdAt: { $gte: since7 } });
    const waste14 = await Waste.find({ storeId, createdAt: { $gte: since14 } });
    const waste30 = await Waste.find({ storeId, createdAt: { $gte: since30 } });

    // Historical shrinkage (snapshot-based)
    const snapshots30 = await InventorySnapshot.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("items.itemId");

    // -----------------------------
    // USAGE SUMMARY
    // -----------------------------
    const usageRecords = await Usage.find({
      storeId,
      createdAt: { $gte: since },
    }).populate("itemId");

    const usageSummary = {};
    for (const u of usageRecords) {
      const item = u.itemId;

      if (!usageSummary[item._id]) {
        usageSummary[item._id] = {
          itemId: item._id,
          name: item.name,
          quantity: 0,
        };
      }

      usageSummary[item._id].quantity += u.quantity;
    }

    // -----------------------------
    // WASTE SUMMARY
    // -----------------------------
    const wasteRecords = await Waste.find({
      storeId,
      createdAt: { $gte: since },
    })
      .populate("rawItemId")
      .populate("finishedProductId");

    const wasteSummary = {};
    for (const w of wasteRecords) {
      const key = w.type === "raw" ? w.rawItemId._id : w.finishedProductId._id;
      const name =
        w.type === "raw" ? w.rawItemId.name : w.finishedProductId.name;

      if (!wasteSummary[key]) {
        wasteSummary[key] = {
          id: key,
          name,
          type: w.type,
          quantity: 0,
        };
      }

      wasteSummary[key].quantity += w.quantity;
    }

    // -----------------------------
    // SHRINKAGE SUMMARY
    // -----------------------------
    const snapshots = await InventorySnapshot.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(2)
      .populate("items.itemId");

    let shrinkageSummary = [];

    if (snapshots.length === 2) {
      const snapA = snapshots[1];
      const snapB = snapshots[0];

      shrinkageSummary = snapA.items.map((itemA) => {
        const itemB = snapB.items.find(
          (i) => i.itemId._id.toString() === itemA.itemId._id.toString(),
        );

        const qtyA = itemA.quantity;
        const qtyB = itemB ? itemB.quantity : 0;

        return {
          itemId: itemA.itemId._id,
          name: itemA.itemId.name,
          shrinkage: qtyA - qtyB,
        };
      });
    }

    // -----------------------------
    // INVENTORY SUMMARY (your old dashboard)
    // -----------------------------
    const items = await Item.find().populate("categoryId");
    const counts = await InventoryCount.find({ storeId });

    const inventorySummary = items.map((item) => {
      const parEntry = item.parLevels.find(
        (p) => p.storeId?.toString() === storeId,
      );
      const par = parEntry ? parEntry.par : 0;

      const countEntry = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      const currentQuantity = countEntry ? countEntry.quantity : 0;

      const orderQuantity = Math.max(par - currentQuantity, 0);

      return {
        itemId: item._id,
        name: item.name,
        photoUrl: item.photoUrl,
        vendor: item.vendor,
        category: item.categoryId?.name,
        par,
        currentQuantity,
        orderQuantity,
      };
    });

    // -----------------------------
    // CALL OTHER INTERNAL ROUTES
    // -----------------------------
    const base = "http://localhost:5000/api";

    const [
      profitability,
      pricing,
      demandForecast,
      staffing,
      replenishment,
      batchPrepSchedule,
      batchPrepCalendar,
    ] = await Promise.all([
      axios.get(`${base}/menuProfitability/${storeId}`).then((r) => r.data),
      axios.get(`${base}/storePricing/${storeId}`).then((r) => r.data),
      axios.get(`${base}/storeDemandForecast/${storeId}`).then((r) => r.data),
      axios.get(`${base}/storeStaffing/${storeId}`).then((r) => r.data),
      axios.get(`${base}/autoParReplenishment/${storeId}`).then((r) => r.data),
      axios.get(`${base}/batchPrepScheduling/${storeId}`).then((r) => r.data),
      axios.get(`${base}/batchPrepCalendar/${storeId}`).then((r) => r.data),
    ]);

    // -----------------------------
    // KPI SCORING ENGINE
    // -----------------------------
    function scoreKPI(value, good, ok, bad) {
      if (value <= good) return { score: 95, grade: "A", color: "green" };
      if (value <= ok) return { score: 80, grade: "B", color: "yellow" };
      if (value <= bad) return { score: 60, grade: "C", color: "orange" };
      return { score: 40, grade: "D", color: "red" };
    }

    function trendArrow(current, previous) {
      if (previous === null) return "→";
      if (current < previous) return "↑";
      if (current > previous) return "↓";
      return "→";
    }

    // Build KPI object
    const kpis = {
      usageEfficiency: {
        label: "Usage Efficiency",
        value: Object.values(usageSummary).reduce(
          (sum, u) => sum + u.quantity,
          0,
        ),
        ...scoreKPI(
          Object.values(usageSummary).reduce((sum, u) => sum + u.quantity, 0),
          500, // good
          800, // ok
          1200, // bad
        ),
        trend: trendArrow(
          Object.values(usageSummary).reduce((sum, u) => sum + u.quantity, 0),
          null,
        ),
        explanation: "Total raw usage over the last 7 days.",
      },

      wasteRate: {
        label: "Waste Rate",
        value: Object.values(wasteSummary).reduce(
          (sum, w) => sum + w.quantity,
          0,
        ),
        ...scoreKPI(
          Object.values(wasteSummary).reduce((sum, w) => sum + w.quantity, 0),
          20, // good
          40, // ok
          80, // bad
        ),
        trend: trendArrow(
          Object.values(wasteSummary).reduce((sum, w) => sum + w.quantity, 0),
          null,
        ),
        explanation: "Total waste units over the last 7 days.",
      },

      shrinkageRate: {
        label: "Shrinkage Rate",
        value: shrinkageSummary.reduce((sum, s) => sum + s.shrinkage, 0),
        ...scoreKPI(
          shrinkageSummary.reduce((sum, s) => sum + s.shrinkage, 0),
          10, // good
          25, // ok
          50, // bad
        ),
        trend: trendArrow(
          shrinkageSummary.reduce((sum, s) => sum + s.shrinkage, 0),
          null,
        ),
        explanation: "Difference between last two inventory snapshots.",
      },

      prepAccuracy: {
        label: "Prep Accuracy",
        value: batchPrepSchedule
          ? Object.values(batchPrepSchedule.batchPrepSchedule).length
          : 0,
        ...scoreKPI(
          batchPrepSchedule
            ? Object.values(batchPrepSchedule.batchPrepSchedule).length
            : 0,
          5, // good
          10, // ok
          20, // bad
        ),
        trend: "→",
        explanation: "Number of items requiring prep vs forecast.",
      },

      staffingAlignment: {
        label: "Staffing Alignment",
        value: staffing
          ? staffing.staffingRecommendations.midday.recommendedStaff.total
          : 0,
        ...scoreKPI(
          staffing
            ? staffing.staffingRecommendations.midday.recommendedStaff.total
            : 0,
          6, // good
          10, // ok
          14, // bad
        ),
        trend: "→",
        explanation: "Staffing match to demand forecast.",
      },

      replenishmentCompliance: {
        label: "Replenishment Compliance",
        value: replenishment
          ? Object.values(replenishment.rawSuggestions).length
          : 0,
        ...scoreKPI(
          replenishment
            ? Object.values(replenishment.rawSuggestions).length
            : 0,
          10, // good
          20, // ok
          40, // bad
        ),
        trend: "→",
        explanation: "Number of items below par or forecast.",
      },
    };
    const kpiHistory = {
      usageEfficiency: {
        "7d": usage7.reduce((sum, u) => sum + u.quantity, 0),
        "14d": usage14.reduce((sum, u) => sum + u.quantity, 0),
        "30d": usage30.reduce((sum, u) => sum + u.quantity, 0),
      },
      wasteRate: {
        "7d": waste7.reduce((sum, w) => sum + w.quantity, 0),
        "14d": waste14.reduce((sum, w) => sum + w.quantity, 0),
        "30d": waste30.reduce((sum, w) => sum + w.quantity, 0),
      },
      shrinkageRate: {
        "7d": shrinkageSummary.reduce((sum, s) => sum + s.shrinkage, 0),
        "14d":
          snapshots30.length >= 3
            ? snapshots30[2].items.reduce((sum, itemA) => {
                const itemB = snapshots30[1].items.find(
                  (i) =>
                    i.itemId._id.toString() === itemA.itemId._id.toString(),
                );
                return sum + (itemA.quantity - (itemB ? itemB.quantity : 0));
              }, 0)
            : 0,
        "30d":
          snapshots30.length >= 4
            ? snapshots30[3].items.reduce((sum, itemA) => {
                const itemB = snapshots30[1].items.find(
                  (i) =>
                    i.itemId._id.toString() === itemA.itemId._id.toString(),
                );
                return sum + (itemA.quantity - (itemB ? itemB.quantity : 0));
              }, 0)
            : 0,
      },
    };

    const kpiHistoryScores = {};

    for (const key in kpiHistory) {
      kpiHistoryScores[key] = {
        "7d": scoreKPI(kpiHistory[key]["7d"], 20, 40, 80).score,
        "14d": scoreKPI(kpiHistory[key]["14d"], 40, 80, 160).score,
        "30d": scoreKPI(kpiHistory[key]["30d"], 80, 160, 320).score,
      };
    }

    const kpiTrends = {};

    for (const key in kpiHistoryScores) {
      const h = kpiHistoryScores[key];

      kpiTrends[key] = {
        trend7to14: trendArrow(h["7d"], h["14d"]),
        trend14to30: trendArrow(h["14d"], h["30d"]),
        overallTrend: trendArrow(h["7d"], h["30d"]),
      };
    }
    // -----------------------------
    // KPI TREND CHART DATA
    // -----------------------------
    const kpiTrendCharts = {};

    function buildChartSeries(historyObj) {
      return [
        { label: "7d", value: historyObj["7d"] },
        { label: "14d", value: historyObj["14d"] },
        { label: "30d", value: historyObj["30d"] },
      ];
    }

    function buildScoreSeries(scoreObj) {
      return [
        { label: "7d", score: scoreObj["7d"] },
        { label: "14d", score: scoreObj["14d"] },
        { label: "30d", score: scoreObj["30d"] },
      ];
    }

    function slopeDirection(v7, v30) {
      if (v30 < v7) return "up";
      if (v30 > v7) return "down";
      return "flat";
    }

    function slopeStrength(v7, v30) {
      const diff = Math.abs(v30 - v7);
      if (diff < 10) return "weak";
      if (diff < 30) return "moderate";
      return "strong";
    }

    for (const key in kpiHistory) {
      const historyValues = kpiHistory[key];
      const scoreValues = kpiHistoryScores[key];

      const direction = slopeDirection(
        historyValues["7d"],
        historyValues["30d"],
      );
      const strength = slopeStrength(historyValues["7d"], historyValues["30d"]);

      kpiTrendCharts[key] = {
        label: kpis[key].label,
        chartSeries: buildChartSeries(historyValues),
        scoreSeries: buildScoreSeries(scoreValues),
        direction,
        strength,
        color:
          direction === "up" ? "green" : direction === "down" ? "red" : "gray",
      };
    }
    // -----------------------------
    // STORE SCORE HISTORY
    // -----------------------------
    const storeScoreHistory = {
      "7d": weightedScore(
        {
          usageEfficiency: { score: kpiHistoryScores.usageEfficiency["7d"] },
          wasteRate: { score: kpiHistoryScores.wasteRate["7d"] },
          shrinkageRate: { score: kpiHistoryScores.shrinkageRate["7d"] },
          prepAccuracy: { score: kpiHistoryScores.prepAccuracy?.["7d"] || 80 },
          staffingAlignment: {
            score: kpiHistoryScores.staffingAlignment?.["7d"] || 80,
          },
          replenishmentCompliance: {
            score: kpiHistoryScores.replenishmentCompliance?.["7d"] || 80,
          },
        },
        weights,
      ),

      "14d": weightedScore(
        {
          usageEfficiency: { score: kpiHistoryScores.usageEfficiency["14d"] },
          wasteRate: { score: kpiHistoryScores.wasteRate["14d"] },
          shrinkageRate: { score: kpiHistoryScores.shrinkageRate["14d"] },
          prepAccuracy: { score: kpiHistoryScores.prepAccuracy?.["14d"] || 75 },
          staffingAlignment: {
            score: kpiHistoryScores.staffingAlignment?.["14d"] || 75,
          },
          replenishmentCompliance: {
            score: kpiHistoryScores.replenishmentCompliance?.["14d"] || 75,
          },
        },
        weights,
      ),

      "30d": weightedScore(
        {
          usageEfficiency: { score: kpiHistoryScores.usageEfficiency["30d"] },
          wasteRate: { score: kpiHistoryScores.wasteRate["30d"] },
          shrinkageRate: { score: kpiHistoryScores.shrinkageRate["30d"] },
          prepAccuracy: { score: kpiHistoryScores.prepAccuracy?.["30d"] || 70 },
          staffingAlignment: {
            score: kpiHistoryScores.staffingAlignment?.["30d"] || 70,
          },
          replenishmentCompliance: {
            score: kpiHistoryScores.replenishmentCompliance?.["30d"] || 70,
          },
        },
        weights,
      ),
    };
    const storeScoreTrend = {
      trend7to14: trendArrow(storeScoreHistory["7d"], storeScoreHistory["14d"]),
      trend14to30: trendArrow(
        storeScoreHistory["14d"],
        storeScoreHistory["30d"],
      ),
      overallTrend: trendArrow(
        storeScoreHistory["7d"],
        storeScoreHistory["30d"],
      ),
      strength: slopeStrength(
        storeScoreHistory["7d"],
        storeScoreHistory["30d"],
      ),
      color:
        storeScoreHistory["30d"] > storeScoreHistory["7d"]
          ? "green"
          : storeScoreHistory["30d"] < storeScoreHistory["7d"]
            ? "red"
            : "gray",
    };
    const storeScoreTrendChart = [
      { label: "7d", score: storeScoreHistory["7d"] },
      { label: "14d", score: storeScoreHistory["14d"] },
      { label: "30d", score: storeScoreHistory["30d"] },
    ];
    // -----------------------------
    // STORE SCORE FORECAST
    // -----------------------------
    const historyValues = [
      storeScoreHistory["30d"],
      storeScoreHistory["14d"],
      storeScoreHistory["7d"],
      storeScore, // current
    ];

    const forecast7d = exponentialSmooth(historyValues, 0.6);
    const forecast30d = exponentialSmooth(historyValues, 0.4);

    const forecast7dBand = forecastBand(forecast7d, 5);
    const forecast30dBand = forecastBand(forecast30d, 8);

    const storeScoreForecast = {
      "7d": {
        center: forecast7d,
        band: forecast7dBand,
      },
      "30d": {
        center: forecast30d,
        band: forecast30dBand,
      },
    };
    // -----------------------------
    // STORE SCORE FORECAST VISUALIZATION
    // -----------------------------
    const storeScoreForecastChart = [
      // Historical
      {
        label: "30d",
        score: storeScoreHistory["30d"],
        type: "history",
        color:
          storeScoreHistory["30d"] >= storeScoreHistory["7d"] ? "green" : "red",
      },
      {
        label: "14d",
        score: storeScoreHistory["14d"],
        type: "history",
        color:
          storeScoreHistory["14d"] >= storeScoreHistory["30d"]
            ? "green"
            : "red",
      },
      {
        label: "7d",
        score: storeScoreHistory["7d"],
        type: "history",
        color:
          storeScoreHistory["7d"] >= storeScoreHistory["14d"] ? "green" : "red",
      },
      {
        label: "Now",
        score: storeScore,
        type: "current",
        color: "blue",
      },

      // Forecast 7d
      {
        label: "Forecast 7d",
        score: storeScoreForecast["7d"].center,
        band: storeScoreForecast["7d"].band,
        type: "forecast",
        color: "purple",
      },

      // Forecast 30d
      {
        label: "Forecast 30d",
        score: storeScoreForecast["30d"].center,
        band: storeScoreForecast["30d"].band,
        type: "forecast",
        color: "purple",
      },
    ];

    // -----------------------------
    // KPI ANOMALY DETECTION
    // -----------------------------
    const kpiAnomalies = [];

    for (const key in kpiHistory) {
      const hist = kpiHistory[key];

      const change7to14 = pctChange(hist["7d"], hist["14d"]);
      const change14to30 = pctChange(hist["14d"], hist["30d"]);

      if (isSpike(change7to14)) {
        kpiAnomalies.push({
          kpi: kpis[key].label,
          type: "Spike",
          detail: `${kpis[key].label} increased by ${change7to14.toFixed(1)}% from 7d to 14d.`,
          severity: "high",
        });
      }

      if (isDrop(change7to14)) {
        kpiAnomalies.push({
          kpi: kpis[key].label,
          type: "Drop",
          detail: `${kpis[key].label} decreased by ${Math.abs(change7to14).toFixed(1)}% from 7d to 14d.`,
          severity: "medium",
        });
      }

      if (isSpike(change14to30)) {
        kpiAnomalies.push({
          kpi: kpis[key].label,
          type: "Spike",
          detail: `${kpis[key].label} increased by ${change14to30.toFixed(1)}% from 14d to 30d.`,
          severity: "high",
        });
      }

      if (isDrop(change14to30)) {
        kpiAnomalies.push({
          kpi: kpis[key].label,
          type: "Drop",
          detail: `${kpis[key].label} decreased by ${Math.abs(change14to30).toFixed(1)}% from 14d to 30d.`,
          severity: "medium",
        });
      }
    }
    // -----------------------------
    // OPERATIONAL ANOMALIES
    // -----------------------------

    // Waste anomaly
    const waste7 = kpiHistory.wasteRate["7d"];
    const waste14 = kpiHistory.wasteRate["14d"];
    const waste30 = kpiHistory.wasteRate["30d"];
    const wasteAvg = (waste7 + waste14 + waste30) / 3;

    if (isDeviation(waste7, wasteAvg)) {
      kpiAnomalies.push({
        kpi: "Waste Rate",
        type: "Abnormal Waste",
        detail: `Waste is ${(((waste7 - wasteAvg) / wasteAvg) * 100).toFixed(1)}% off expected levels.`,
        severity: "high",
      });
    }

    // Shrinkage anomaly
    const shrink7 = kpiHistory.shrinkageRate["7d"];
    const shrinkAvg =
      (kpiHistory.shrinkageRate["14d"] + kpiHistory.shrinkageRate["30d"]) / 2;

    if (isDeviation(shrink7, shrinkAvg)) {
      kpiAnomalies.push({
        kpi: "Shrinkage Rate",
        type: "Abnormal Shrinkage",
        detail: `Shrinkage deviates ${(((shrink7 - shrinkAvg) / shrinkAvg) * 100).toFixed(1)}% from expected.`,
        severity: "high",
      });
    }

    // Store score anomaly
    const score7 = storeScoreHistory["7d"];
    const score30 = storeScoreHistory["30d"];
    const scoreChange = pctChange(score30, score7);

    if (isDrop(scoreChange, -10)) {
      kpiAnomalies.push({
        kpi: "Store Score",
        type: "Score Drop",
        detail: `Store score dropped ${Math.abs(scoreChange).toFixed(1)}% over 30 days.`,
        severity: "high",
      });
    }

    // -----------------------------
    // WEIGHTED STORE SCORE
    // -----------------------------
    const weights = {
      usageEfficiency: 0.2,
      wasteRate: 0.25,
      shrinkageRate: 0.15,
      prepAccuracy: 0.1,
      staffingAlignment: 0.2,
      replenishmentCompliance: 0.1,
    };

    function weightedScore(kpis, weights) {
      let total = 0;

      for (const key in weights) {
        const kpi = kpis[key];
        if (!kpi) continue;

        total += kpi.score * weights[key];
      }

      return Math.round(total);
    }
    // -----------------------------
    // ANOMALY DETECTION HELPERS
    // -----------------------------
    function pctChange(oldVal, newVal) {
      if (oldVal === 0) return 0;
      return ((newVal - oldVal) / oldVal) * 100;
    }

    function isSpike(change, threshold = 25) {
      return change >= threshold;
    }

    function isDrop(change, threshold = -25) {
      return change <= threshold;
    }

    function isDeviation(value, avg, threshold = 30) {
      if (avg === 0) return false;
      return Math.abs(((value - avg) / avg) * 100) >= threshold;
    }
    function exponentialSmooth(values, alpha = 0.5) {
      if (!values.length) return 0;

      let smoothed = values[0];

      for (let i = 1; i < values.length; i++) {
        smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      }

      return Math.round(smoothed);
    }

    function forecastBand(center, spread = 5) {
      return {
        low: Math.max(0, Math.round(center - spread)),
        high: Math.min(100, Math.round(center + spread)),
      };
    }

    const storeScore = weightedScore(kpis, weights);

    // Grade + color
    function scoreToGrade(score) {
      if (score >= 90) return { grade: "A", color: "green" };
      if (score >= 80) return { grade: "B", color: "yellow" };
      if (score >= 70) return { grade: "C", color: "orange" };
      if (score >= 60) return { grade: "D", color: "red" };
      return { grade: "F", color: "darkred" };
    }
    function forecastSlopeDirection(current, future) {
      if (future > current) return "up";
      if (future < current) return "down";
      return "flat";
    }
    const storeScoreForecastSlope = {
      "7d": forecastSlopeDirection(storeScore, storeScoreForecast["7d"].center),
      "30d": forecastSlopeDirection(
        storeScore,
        storeScoreForecast["30d"].center,
      ),
    };

    const storeScoreMeta = scoreToGrade(storeScore);

    // -----------------------------
    // FINAL DASHBOARD RESPONSE
    // -----------------------------
    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
        driveThruEnabled: store.driveThruEnabled,
        driveThruLanes: store.driveThruLanes,
      },
      usageSummary,
      wasteSummary,
      shrinkageSummary,
      inventorySummary,
      profitability,
      pricing,
      demandForecast,
      staffing,
      replenishment,
      batchPrepSchedule,
      batchPrepCalendar,
      kpis,
      storeScore: {
        score: storeScore,
        grade: storeScoreMeta.grade,
        color: storeScoreMeta.color,
      },
      kpiHistory,
      kpiHistoryScores,
      kpiTrends,
      kpiTrendCharts,
      storeScoreHistory,
      storeScoreTrend,
      storeScoreTrendChart,
      kpiAnomalies,
      storeScoreHistory,
      storeScoreTrend,
      storeScoreTrendChart,
      storeScoreForecast,
      kpiAnomalies,
      storeScoreForecast,
      storeScoreForecastChart,
      storeScoreForecastSlope,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
