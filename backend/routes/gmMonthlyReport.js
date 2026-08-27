const express = require("express");
const router = express.Router();
const axios = require("axios");

const Store = require("../models/Store");

// GM MONTHLY REPORT
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const base = "http://localhost:5000/api/storeDashboard";

    // Pull full store dashboard
    const dashboard = await axios.get(`${base}/${storeId}`).then((r) => r.data);

    const {
      storeScore,
      storeScoreHistory,
      storeScoreTrend,
      storeScoreForecast,
      kpis,
      kpiHistory,
      kpiHistoryScores,
      kpiTrends,
      kpiTrendCharts,
      kpiAnomalies,
      usageSummary,
      wasteSummary,
      shrinkageSummary,
      inventorySummary,
      staffing,
      replenishment,
    } = dashboard;

    // -----------------------------
    // MONTHLY KPI AVERAGES
    // -----------------------------
    const monthlyKPIAverages = {};
    for (const key in kpiHistory) {
      monthlyKPIAverages[key] = {
        label: kpis[key].label,
        average: Math.round(
          (kpiHistory[key]["7d"] +
            kpiHistory[key]["14d"] +
            kpiHistory[key]["30d"]) /
            3,
        ),
        score: Math.round(
          (kpiHistoryScores[key]["7d"] +
            kpiHistoryScores[key]["14d"] +
            kpiHistoryScores[key]["30d"]) /
            3,
        ),
        trend: kpiTrends[key].overallTrend,
      };
    }

    // -----------------------------
    // MONTHLY TOP ISSUES
    // -----------------------------
    const monthlyIssues = Object.values(monthlyKPIAverages)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // -----------------------------
    // MONTHLY TOP IMPROVEMENTS
    // -----------------------------
    const monthlyImprovements = Object.values(monthlyKPIAverages)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // -----------------------------
    // MONTHLY ANOMALY SUMMARY
    // -----------------------------
    const monthlyAnomalySummary = {
      total: kpiAnomalies.length,
      highSeverity: kpiAnomalies.filter((a) => a.severity === "high").length,
      mediumSeverity: kpiAnomalies.filter((a) => a.severity === "medium")
        .length,
      anomalies: kpiAnomalies,
    };

    // -----------------------------
    // MONTHLY ACTION PLAN
    // -----------------------------
    const monthlyActionPlan = [
      {
        title: "Reduce Waste",
        detail: "Focus on top waste items and adjust prep accuracy.",
        priority: "high",
      },
      {
        title: "Improve Staffing Alignment",
        detail: "Adjust staffing schedules based on demand forecast.",
        priority: "high",
      },
      {
        title: "Strengthen Inventory Controls",
        detail: "Investigate shrinkage anomalies and tighten counts.",
        priority: "medium",
      },
      {
        title: "Enhance Replenishment Compliance",
        detail: "Ensure vendor orders are placed for below-par items.",
        priority: "medium",
      },
      {
        title: "Boost Usage Efficiency",
        detail: "Review portioning and batch prep consistency.",
        priority: "low",
      },
    ];

    // -----------------------------
    // FINAL MONTHLY REPORT
    // -----------------------------
    const report = {
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
        districtId: store.districtId,
        driveThruEnabled: store.driveThruEnabled,
        driveThruLanes: store.driveThruLanes,
      },
      generatedAt: new Date(),
      storeScore,
      storeScoreHistory,
      storeScoreTrend,
      storeScoreForecast,
      monthlyKPIAverages,
      monthlyIssues,
      monthlyImprovements,
      monthlyAnomalySummary,
      usageSummary,
      wasteSummary,
      shrinkageSummary,
      inventorySummary,
      staffing,
      replenishment,
      monthlyActionPlan,
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
