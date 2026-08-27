const express = require("express");
const router = express.Router();
const axios = require("axios");

const Store = require("../models/Store");

// GM WEEKLY REPORT
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const base = "http://localhost:5000/api";

    // Pull full store dashboard
    const dashboard = await axios
      .get(`${base}/storeDashboard/${storeId}`)
      .then((r) => r.data);

    // Extract key sections
    const {
      storeScore,
      storeScoreHistory,
      storeScoreTrend,
      kpis,
      kpiHistory,
      kpiHistoryScores,
      kpiTrends,
      usageSummary,
      wasteSummary,
      shrinkageSummary,
      inventorySummary,
      replenishment,
      batchPrepSchedule,
      batchPrepCalendar,
      staffing,
    } = dashboard;

    // Build top issues
    const topIssues = Object.values(kpis)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((k) => ({
        label: k.label,
        score: k.score,
        grade: k.grade,
        color: k.color,
        explanation: k.explanation,
      }));

    // Build top opportunities
    const topOpportunities = Object.values(kpis)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((k) => ({
        label: k.label,
        score: k.score,
        grade: k.grade,
        color: k.color,
        explanation: k.explanation,
      }));

    // GM Action Items
    const gmActionItems = [
      {
        title: "Reduce Waste",
        detail: "Focus on top 3 waste items and review prep accuracy.",
        relatedKPI: "Waste Rate",
      },
      {
        title: "Improve Staffing Alignment",
        detail: "Adjust midday staffing based on demand forecast.",
        relatedKPI: "Staffing Alignment",
      },
      {
        title: "Replenishment Compliance",
        detail: "Review items below par and ensure vendor orders are placed.",
        relatedKPI: "Replenishment Compliance",
      },
    ];

    // Final report object
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
      kpis,
      kpiHistory,
      kpiHistoryScores,
      kpiTrends,
      usageSummary,
      wasteSummary,
      shrinkageSummary,
      inventorySummary,
      replenishment,
      batchPrepSchedule,
      batchPrepCalendar,
      staffing,
      topIssues,
      topOpportunities,
      gmActionItems,
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
