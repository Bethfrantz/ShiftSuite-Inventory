const express = require("express");
const router = express.Router();
const axios = require("axios");

const Store = require("../models/Store");

// -----------------------------
// ESCALATION HELPERS
// -----------------------------
function escalateSeverity(current, conditions) {
  let level = current;

  if (conditions.persistent) {
    if (level === "low") level = "medium";
    else if (level === "medium") level = "high";
  }

  if (conditions.worsening) {
    if (level === "low") level = "medium";
    else if (level === "medium") level = "high";
  }

  if (conditions.multiKPI) {
    level = "high";
  }

  if (conditions.extreme) {
    level = "critical";
  }

  return level;
}

function severityColor(level) {
  return {
    low: "yellow",
    medium: "orange",
    high: "red",
    critical: "purple",
  }[level];
}

function severityPriority(level) {
  return {
    low: 3,
    medium: 2,
    high: 1,
    critical: 0,
  }[level];
}

function detectEscalationConditions(kpiKey, history) {
  const v7 = history["7d"];
  const v14 = history["14d"];
  const v30 = history["30d"];

  return {
    persistent: v7 > v14 && v14 > v30,
    worsening: v7 < v14 || v14 < v30,
    extreme: v7 > v30 * 1.5,
    multiKPI: false,
  };
}

function getRecommendedAction(kpi) {
  const actions = {
    "Waste Rate": "Audit top waste items and review prep accuracy.",
    "Shrinkage Rate": "Check inventory counts and investigate discrepancies.",
    "Usage Efficiency": "Review batch prep and portioning accuracy.",
    "Staffing Alignment": "Adjust staffing to match demand forecast.",
    "Replenishment Compliance": "Place vendor orders for items below par.",
  };
  return actions[kpi] || "Review KPI details.";
}

// -----------------------------
// ALERT ROUTE
// -----------------------------
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const dashboard = await axios
      .get(`http://localhost:5000/api/storeDashboard/${storeId}`)
      .then((r) => r.data);

    const {
      kpiAnomalies,
      kpiHistory,
      kpis,
      storeScoreTrend,
      storeScoreHistory,
      storeScoreForecast,
    } = dashboard;

    // -----------------------------
    // KPI ESCALATION
    // -----------------------------
    const anomalyCounts = {};
    kpiAnomalies.forEach((a) => {
      anomalyCounts[a.kpi] = (anomalyCounts[a.kpi] || 0) + 1;
    });

    const multiKPITriggered = Object.keys(anomalyCounts).length >= 3;

    const escalatedAlerts = kpiAnomalies.map((a) => {
      const key = Object.keys(kpiHistory).find((k) => kpis[k].label === a.kpi);
      const history = kpiHistory[key];

      const conditions = detectEscalationConditions(key, history);
      conditions.multiKPI = multiKPITriggered;

      const newSeverity = escalateSeverity(a.severity, conditions);

      return {
        type: "KPI",
        kpi: a.kpi,
        message: a.detail,
        severity: newSeverity,
        color: severityColor(newSeverity),
        priority: severityPriority(newSeverity),
        conditions,
        recommendedAction: getRecommendedAction(a.kpi),
        timestamp: new Date(),
      };
    });

    // -----------------------------
    // STORE SCORE ALERT
    // -----------------------------
    if (storeScoreTrend.overallTrend === "↓") {
      escalatedAlerts.push({
        type: "Store Score",
        severity: "high",
        message: "Store score is trending downward over the last 30 days.",
        color: "red",
        priority: 1,
        recommendedAction: "Review top KPIs dragging score down.",
        timestamp: new Date(),
      });
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      alerts: escalatedAlerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
