const express = require("express");
const router = express.Router();
// axios will be removed once we replace internal HTTP calls with direct DB access
// const axios = require("axios");

const Store = require("../models/Store");

/* -------------------------------------------------------
   Helper: Throw formatted errors
------------------------------------------------------- */
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

/* -------------------------------------------------------
   Middleware: Attach Request ID
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

/* -------------------------------------------------------
   Helper functions for scoring, trends, and phrasing
------------------------------------------------------- */

function simulateChange(base, percent) {
  return +(base * (1 + percent / 100)).toFixed(2);
}

function influenceScore(corr, percent) {
  return +(corr * percent).toFixed(3);
}

function influenceTier(score) {
  const abs = Math.abs(score);
  if (abs >= 0.15) return "Strong";
  if (abs >= 0.07) return "Moderate";
  return "Weak";
}

function influenceColor(score) {
  const abs = Math.abs(score);
  if (abs >= 0.15) return "red";
  if (abs >= 0.07) return "yellow";
  return "green";
}

function annualPhrase(trend) {
  return {
    improving: "demonstrating sustained year-over-year improvement",
    declining: "showing signs of year-over-year decline requiring intervention",
    steady: "remaining stable across the year",
  }[trend];
}

function annualOutlookPhrase(outlook) {
  return {
    positive: "a strong outlook heading into next fiscal year",
    neutral: "a balanced outlook with moderate variability",
    negative: "a challenging outlook requiring proactive district action",
  }[outlook];
}

function annualRiskPhrase(tier) {
  return {
    Low: "low operational risk with stable annual performance",
    Medium: "moderate operational risk requiring targeted annual focus",
    High: "high operational risk requiring district-level action",
    Critical: "critical operational risk requiring immediate intervention",
  }[tier];
}

function dependencyStrength(corr) {
  const abs = Math.abs(corr);
  if (abs >= 0.7) return "Strong";
  if (abs >= 0.4) return "Moderate";
  return "Weak";
}

function dependencyColor(corr) {
  const abs = Math.abs(corr);
  if (abs >= 0.7) return "red";
  if (abs >= 0.4) return "yellow";
  return "green";
}

function dependencyDirection(corr) {
  return corr >= 0 ? "positive" : "negative";
}

function quarterPhrase(trend) {
  return {
    improving: "demonstrating sustained upward momentum this quarter",
    declining: "showing signs of quarterly decline requiring intervention",
    steady: "remaining stable across the quarter",
  }[trend];
}

function quarterOutlookPhrase(outlook) {
  return {
    positive: "a strong outlook heading into next quarter",
    neutral: "a balanced outlook with moderate variability",
    negative: "a challenging outlook requiring proactive district action",
  }[outlook];
}

function quarterRiskPhrase(tier) {
  return {
    Low: "low operational risk with stable quarterly performance",
    Medium: "moderate operational risk requiring targeted quarterly focus",
    High: "high operational risk requiring district‑level action",
    Critical: "critical operational risk requiring immediate intervention",
  }[tier];
}

function weightedScore(values, weights) {
  let score = 0;
  for (let i = 0; i < values.length; i++) {
    score += values[i] * weights[i];
  }
  return Math.round(score);
}

function riskPredictTier(score) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function riskPredictColor(tier) {
  return {
    Critical: "purple",
    High: "red",
    Medium: "orange",
    Low: "green",
  }[tier];
}

function correlation(a, b) {
  const n = a.length;
  if (n !== b.length || n === 0) return 0;

  const avgA = a.reduce((s, v) => s + v, 0) / n;
  const avgB = b.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denA = 0;
  let denB = 0;

  for (let i = 0; i < n; i++) {
    const da = a[i] - avgA;
    const db = b[i] - avgB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }

  const denom = Math.sqrt(denA * denB);
  return denom === 0 ? 0 : +(num / denom).toFixed(3);
}

function correlationTier(score) {
  const abs = Math.abs(score);
  if (abs >= 0.7) return "Strong";
  if (abs >= 0.4) return "Moderate";
  return "Weak";
}

function correlationColor(score) {
  const abs = Math.abs(score);
  if (abs >= 0.7) return "red";
  if (abs >= 0.4) return "yellow";
  return "green";
}

function execPhrase(trend) {
  return {
    improving: "showing positive momentum",
    declining: "experiencing downward pressure",
    steady: "remaining stable month-over-month",
  }[trend];
}

function outlookPhrase(outlook) {
  return {
    positive: "a favorable outlook for the upcoming period",
    neutral: "a balanced outlook with moderate variability",
    negative: "a challenging outlook requiring proactive intervention",
  }[outlook];
}

function riskPhrase(tier) {
  return {
    Low: "operationally stable with minimal risk indicators",
    Medium: "moderate risk requiring targeted attention",
    High: "significant operational risk requiring district-level action",
    Critical: "urgent operational risk requiring immediate intervention",
  }[tier];
}

function mitigationPriority(score) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function mitigationColor(priority) {
  return {
    Critical: "purple",
    High: "red",
    Medium: "orange",
    Low: "green",
  }[priority];
}

function mitigationForKpi(kpiKey) {
  const actions = {
    wasteRate: [
      "Audit top waste items.",
      "Retrain prep staff on portioning.",
      "Review batch prep accuracy.",
    ],
    shrinkageRate: [
      "Audit inventory counts.",
      "Review delivery logs.",
      "Investigate shrinkage discrepancies.",
    ],
    usageEfficiency: [
      "Review batch prep schedules.",
      "Check portioning accuracy.",
      "Monitor usage spikes.",
    ],
    staffingAlignment: [
      "Adjust staffing schedules.",
      "Review peak-hour coverage.",
      "Align shifts with demand forecast.",
    ],
    replenishmentCompliance: [
      "Place vendor orders for below-par items.",
      "Review par levels.",
      "Audit replenishment timing.",
    ],
  };

  return actions[kpiKey] || ["Review KPI details."];
}

function kpiVolatility(values) {
  if (values.length < 2) return 0;

  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(Math.abs(values[i] - values[i - 1]));
  }

  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function volatilityTier(score) {
  if (score >= 30) return "High";
  if (score >= 15) return "Medium";
  return "Low";
}

function volatilityColor(score) {
  if (score >= 30) return "red";
  if (score >= 15) return "yellow";
  return "green";
}

function trendWord(score7, score30) {
  if (score30 > score7) return "improving";
  if (score30 < score7) return "declining";
  return "steady";
}

function outlookWord(forecastSlope) {
  if (forecastSlope === "up") return "positive";
  if (forecastSlope === "down") return "negative";
  return "neutral";
}

function riskWord(tier) {
  return (
    {
      Low: "stable",
      Medium: "watchlist",
      High: "concerning",
      Critical: "urgent",
    }[tier] || "unknown"
  );
}

function riskTier(score) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function riskColor(score) {
  if (score >= 75) return "purple";
  if (score >= 50) return "red";
  if (score >= 25) return "orange";
  return "green";
}

function volatility(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    if (typeof values[i] !== "number" || typeof values[i - 1] !== "number")
      continue;
    diffs.push(Math.abs(values[i] - values[i - 1]));
  }
  if (!diffs.length) return 0;
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function bandWidth(band) {
  if (!band || typeof band.low !== "number" || typeof band.high !== "number")
    return 0;
  return band.high - band.low;
}

function confidenceTier(score) {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function confidenceColor(score) {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

function recommendForKpi(kpiKey, avgScore) {
  const recs = {
    wasteRate: {
      high: "Audit top waste items and retrain prep staff.",
      medium: "Review prep accuracy and portioning.",
      low: "Monitor waste trends for early spikes.",
    },
    shrinkageRate: {
      high: "Investigate shrinkage discrepancies and audit inventory counts.",
      medium: "Review delivery logs and count accuracy.",
      low: "Monitor shrinkage for unusual changes.",
    },
    usageEfficiency: {
      high: "Review batch prep accuracy and portioning.",
      medium: "Check prep schedules against demand.",
      low: "Monitor usage for spikes.",
    },
    staffingAlignment: {
      high: "Adjust staffing schedules to match demand forecast.",
      medium: "Review shift coverage and peak hours.",
      low: "Monitor staffing alignment.",
    },
    replenishmentCompliance: {
      high: "Place vendor orders for items below par.",
      medium: "Review par levels and adjust ordering.",
      low: "Monitor replenishment compliance.",
    },
  };

  const cfg = recs[kpiKey];
  if (!cfg) return "Review KPI details.";

  if (avgScore < 60) return cfg.high;
  if (avgScore < 75) return cfg.medium;
  return cfg.low;
}

function recommendForStore(store) {
  const recs = [];
  if (!store || typeof store.score !== "number" || !store.kpis) return recs;

  if (store.score < 70) {
    recs.push("Store score is low — review top KPIs dragging performance.");
  }

  const anomalyCount = store.kpiAnomalies?.length || 0;
  if (anomalyCount >= 4) {
    recs.push("High anomaly count — investigate operational issues.");
  }

  if (store.kpis.wasteRate?.score < 60) {
    recs.push("High waste — audit prep accuracy and portioning.");
  }

  if (store.kpis.shrinkageRate?.score < 60) {
    recs.push("High shrinkage — audit inventory counts and deliveries.");
  }

  if (store.kpis.staffingAlignment?.score < 60) {
    recs.push("Staffing misaligned — adjust schedules to match demand.");
  }

  return recs;
}

function classifyAnomaly(anomaly) {
  if (!anomaly || !anomaly.kpi) return "other";

  const k = anomaly.kpi.toLowerCase();

  if (k.includes("waste")) return "waste";
  if (k.includes("shrink")) return "shrinkage";
  if (k.includes("usage")) return "usage";
  if (k.includes("staff")) return "staffing";
  if (k.includes("replenish")) return "replenishment";

  return "other";
}

function detectClusters(anomalyHeatmap, threshold = 4) {
  if (!Array.isArray(anomalyHeatmap)) return [];
  const clusters = [];

  const highRiskStores = anomalyHeatmap.filter(
    (s) => (s.anomalyCount || 0) >= threshold,
  );

  for (const store of highRiskStores) {
    clusters.push({
      storeId: store.storeId,
      storeName: store.storeName,
      anomalyCount: store.anomalyCount,
      location: store.location,
      color: store.color,
      intensity: store.intensity,
    });
  }

  return clusters;
}

function rankStores(stores, key) {
  if (!Array.isArray(stores) || !key) return [];
  return [...stores]
    .filter((s) => typeof s[key] === "number")
    .sort((a, b) => b[key] - a[key])
    .map((s, i) => ({
      rank: i + 1,
      storeId: s.storeId,
      storeName: s.storeName,
      value: s[key],
    }));
}

function tierFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function exponentialSmooth(values, alpha = 0.5) {
  if (!Array.isArray(values) || !values.length) return 0;

  let smoothed = values[0];

  for (let i = 1; i < values.length; i++) {
    if (typeof values[i] !== "number") continue;
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }

  return Math.round(smoothed);
}

function forecastBand(center, spread = 5) {
  if (typeof center !== "number") center = 0;
  if (typeof spread !== "number") spread = 5;

  return {
    low: Math.max(0, Math.round(center - spread)),
    high: Math.min(100, Math.round(center + spread)),
  };
}

function slopeDirection(current, future) {
  if (future > current) return "up";
  if (future < current) return "down";
  return "flat";
}

function slopeStrength(current, future) {
  const diff = Math.abs(future - current);
  if (diff < 5) return "weak";
  if (diff < 15) return "moderate";
  return "strong";
}

// DISTRICT COMPARISON DASHBOARD
router.get("/:districtId", async (req, res, next) => {
  try {
    const { districtId } = req.params;
    if (!districtId) throwError("districtId is required", 400);

    const stores = await Store.find({ district: districtId });
    if (!stores.length) throwError("No stores found for this district", 404);

    const base = "http://localhost:5000/api/storeDashboard";

    // Fetch each store’s dashboard (defensive, allows partial success)
    const results = await Promise.allSettled(
      stores.map((store) =>
        axios.get(`${base}/${store._id}`).then((r) => ({
          storeId: store._id,
          storeName: store.name,
          storeNumber: store.storeNumber,
          dashboard: r.data,
        })),
      ),
    );

    const dashboards = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    if (!dashboards.length)
      throwError("No store dashboards could be loaded", 500);

    const storeComparisons = dashboards.map((d) => {
      const ds = d.dashboard || {};
      const storeScore = ds.storeScore || {};
      const kpis = ds.kpis || {};
      const kpiHistory = ds.kpiHistory || {};
      const kpiTrends = ds.kpiTrends || {};
      const storeScoreHistory = ds.storeScoreHistory || {};
      const storeScoreForecast = ds.storeScoreForecast || {};
      const kpiAnomalies = ds.kpiAnomalies || [];

      return {
        storeId: d.storeId,
        storeName: d.storeName,
        storeNumber: d.storeNumber,
        score: storeScore.score ?? 0,
        grade: storeScore.grade ?? "N/A",
        color: storeScore.color ?? "gray",
        kpis,
        kpiHistory,
        kpiTrends,
        storeScoreHistory,
        storeScoreTrend: ds.storeScoreTrend || {},
        kpiAnomalies,
        storeScoreForecast,
        dashboard: ds,
      };
    });

    const overallRanking = rankStores(
      storeComparisons.map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        score: s.score,
      })),
      "score",
    );

    const kpiRankings = {};
    const firstKpis = storeComparisons[0]?.kpis || {};

    for (const kpiKey of Object.keys(firstKpis)) {
      kpiRankings[kpiKey] = rankStores(
        storeComparisons.map((s) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          value: s.kpis[kpiKey]?.score ?? 0,
        })),
        "value",
      );
    }

    const anomalyRanking = rankStores(
      storeComparisons.map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        value: s.kpiAnomalies ? s.kpiAnomalies.length : 0,
      })),
      "value",
    );

    const forecastRanking = rankStores(
      storeComparisons.map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        value: s.storeScoreForecast["30d"]?.center ?? s.score,
      })),
      "value",
    );

    const performanceTiers = overallRanking.map((r) => ({
      ...r,
      tier: tierFromScore(r.value),
    }));

    const districtAverageScore = Math.round(
      storeComparisons.reduce((sum, s) => sum + (s.score || 0), 0) /
        storeComparisons.length,
    );

    // we’ll continue refactoring the rest (heatmap, forecast, risk, volatility, weeklySummary)
    // once you paste the next chunk
  } catch (err) {
    next(err);
  }
});

// Best and worst stores
const bestStore =
  storeComparisons.length > 0
    ? storeComparisons.reduce((a, b) => (a.score > b.score ? a : b))
    : null;

const worstStore =
  storeComparisons.length > 0
    ? storeComparisons.reduce((a, b) => (a.score < b.score ? a : b))
    : null;

// -----------------------------
// DISTRICT HEATMAP
// -----------------------------
const districtHeatmap = storeComparisons.map((s) => {
  const score = s.score ?? 0;

  let color =
    score >= 90
      ? "#2ecc71"
      : score >= 80
        ? "#f1c40f"
        : score >= 70
          ? "#e67e22"
          : score >= 60
            ? "#e74c3c"
            : "#8e44ad";

  const wasteScore = s.kpis.wasteRate?.score ?? 100;
  const shrinkScore = s.kpis.shrinkageRate?.score ?? 100;
  const wasteIntensity = wasteScore <= 60 ? 1 : 0;
  const shrinkIntensity = shrinkScore <= 60 ? 1 : 0;
  const anomalyIntensity = s.kpiAnomalies ? s.kpiAnomalies.length : 0;

  const location = s.dashboard.store?.location || null;

  return {
    storeId: s.storeId,
    storeName: s.storeName,
    storeNumber: s.storeNumber,
    location,
    score,
    color,
    layers: {
      scoreColor: color,
      wasteIntensity,
      shrinkIntensity,
      anomalyIntensity,
    },
  };
});

// KPI comparison across stores
const kpiComparison = {};
const firstKpis = storeComparisons[0]?.kpis || {};

for (const key of Object.keys(firstKpis)) {
  kpiComparison[key] = {
    label: firstKpis[key]?.label || key,
    values: storeComparisons.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      score: s.kpis[key]?.score ?? 0,
      grade: s.kpis[key]?.grade ?? "N/A",
      color: s.kpis[key]?.color ?? "gray",
    })),
    averageScore: Math.round(
      storeComparisons.reduce((sum, s) => sum + (s.kpis[key]?.score ?? 0), 0) /
        storeComparisons.length,
    ),
  };
}

// Chart-ready district score trend
const districtScoreTrendChart = [
  {
    label: "7d",
    score: Math.round(
      storeComparisons.reduce(
        (sum, s) => sum + (s.storeScoreHistory["7d"] ?? s.score ?? 0),
        0,
      ) / storeComparisons.length,
    ),
  },
  {
    label: "14d",
    score: Math.round(
      storeComparisons.reduce(
        (sum, s) => sum + (s.storeScoreHistory["14d"] ?? s.score ?? 0),
        0,
      ) / storeComparisons.length,
    ),
  },
  {
    label: "30d",
    score: Math.round(
      storeComparisons.reduce(
        (sum, s) => sum + (s.storeScoreHistory["30d"] ?? s.score ?? 0),
        0,
      ) / storeComparisons.length,
    ),
  },
];

// -----------------------------
// DISTRICT SCORE FORECAST
// -----------------------------
const districtScoreHistory = {
  "7d": districtScoreTrendChart[0]?.score ?? districtAverageScore,
  "14d": districtScoreTrendChart[1]?.score ?? districtAverageScore,
  "30d": districtScoreTrendChart[2]?.score ?? districtAverageScore,
};

const historyValues = [
  districtScoreHistory["30d"],
  districtScoreHistory["14d"],
  districtScoreHistory["7d"],
  districtAverageScore,
];

const forecast7d = exponentialSmooth(historyValues, 0.6);
const forecast30d = exponentialSmooth(historyValues, 0.4);

const forecast7dBand = forecastBand(forecast7d, 5);
const forecast30dBand = forecastBand(forecast30d, 8);

const districtScoreForecast = {
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
// DISTRICT SCORE FORECAST VISUALIZATION
// -----------------------------
const districtScoreForecastChart = [
  {
    label: "30d",
    score: districtScoreHistory["30d"],
    type: "history",
    color:
      districtScoreHistory["30d"] >= districtScoreHistory["7d"]
        ? "green"
        : "red",
  },
  {
    label: "14d",
    score: districtScoreHistory["14d"],
    type: "history",
    color:
      districtScoreHistory["14d"] >= districtScoreHistory["30d"]
        ? "green"
        : "red",
  },
  {
    label: "7d",
    score: districtScoreHistory["7d"],
    type: "history",
    color:
      districtScoreHistory["7d"] >= districtScoreHistory["14d"]
        ? "green"
        : "red",
  },
  {
    label: "Now",
    score: districtAverageScore,
    type: "current",
    color: "blue",
  },
  {
    label: "Forecast 7d",
    score: districtScoreForecast["7d"].center,
    band: districtScoreForecast["7d"].band,
    type: "forecast",
    color: "purple",
  },
  {
    label: "Forecast 30d",
    score: districtScoreForecast["30d"].center,
    band: districtScoreForecast["30d"].band,
    type: "forecast",
    color: "purple",
  },
];

const districtScoreForecastSlope = {
  "7d": slopeDirection(
    districtAverageScore,
    districtScoreForecast["7d"].center,
  ),
  "30d": slopeDirection(
    districtAverageScore,
    districtScoreForecast["30d"].center,
  ),
  strength: slopeStrength(
    districtAverageScore,
    districtScoreForecast["30d"].center,
  ),
};

// -----------------------------
// DISTRICT FORECAST CONFIDENCE SCORING
// -----------------------------
const histValues = [
  districtScoreHistory["30d"],
  districtScoreHistory["14d"],
  districtScoreHistory["7d"],
  districtAverageScore,
];

const vol = volatility(histValues);
const band7 = bandWidth(districtScoreForecast["7d"].band);
const band30 = bandWidth(districtScoreForecast["30d"].band);

const anomalyPressure =
  anomalyRanking[0]?.value ?? (storeComparisons.length ? 0 : 0);
const slope = districtScoreForecastSlope.strength;

let confidenceScore =
  100 -
  vol * 1.2 -
  band30 * 0.8 -
  anomalyPressure * 2 -
  (slope === "strong" ? 10 : slope === "moderate" ? 5 : 0);

confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

const districtForecastConfidence = {
  score: confidenceScore,
  tier: confidenceTier(confidenceScore),
  color: confidenceColor(confidenceScore),
  factors: {
    volatility: vol,
    bandWidth7d: band7,
    bandWidth30d: band30,
    anomalyPressure,
    slope,
  },
};

// -----------------------------
// DISTRICT OPERATIONAL RISK SCORE
// -----------------------------
const avgAnomalies =
  storeComparisons.reduce((sum, s) => sum + (s.kpiAnomalies?.length || 0), 0) /
  storeComparisons.length;

const weakKpiCount = Object.values(kpiComparison).filter(
  (k) => k.averageScore < 70,
).length;

const lowScoreStores = storeComparisons.filter((s) => s.score < 70).length;

const volatilityScore = districtForecastConfidence.factors.volatility;
const forecastConfidenceScore = districtForecastConfidence.score;

// anomalyClusters will be computed later from districtHeatmap
const anomalyHeatmap = districtHeatmap.map((h) => ({
  storeId: h.storeId,
  storeName: h.storeName,
  anomalyCount: h.layers.anomalyIntensity,
  location: h.location,
  color: h.color,
  intensity: h.layers.anomalyIntensity,
}));
const anomalyClusters = detectClusters(anomalyHeatmap);
const clusterPressure = anomalyClusters.length;

let operationalRisk =
  avgAnomalies * 3 +
  weakKpiCount * 5 +
  lowScoreStores * 4 +
  volatilityScore * 1.5 +
  (100 - forecastConfidenceScore) * 0.8 +
  clusterPressure * 6;

operationalRisk = Math.min(100, Math.round(operationalRisk));

const districtOperationalRisk = {
  score: operationalRisk,
  tier: riskTier(operationalRisk),
  color: riskColor(operationalRisk),
  factors: {
    avgAnomalies,
    weakKpiCount,
    lowScoreStores,
    volatility: volatilityScore,
    forecastConfidence: forecastConfidenceScore,
    clusterPressure,
  },
};

// -----------------------------
// DISTRICT IMPROVEMENT RECOMMENDATIONS
// -----------------------------
const districtRecommendations = [];

// 1. KPI-level recommendations
for (const key of Object.keys(kpiComparison)) {
  const avgScore = kpiComparison[key]?.averageScore ?? 0;
  const label = kpiComparison[key]?.label ?? key;

  districtRecommendations.push({
    type: "KPI",
    kpi: label,
    recommendation: recommendForKpi(key, avgScore),
    priority: avgScore < 60 ? 1 : avgScore < 75 ? 2 : 3,
  });
}

// 2. Store-level recommendations
const storeRecommendations = storeComparisons.map((s) => ({
  storeId: s.storeId,
  storeName: s.storeName,
  recommendations: recommendForStore(s),
  priority: s.score < 70 || (s.kpiAnomalies?.length || 0) >= 4 ? 1 : 2,
}));

// 3. District-level strategic recommendations
if (districtAverageScore < 75) {
  districtRecommendations.push({
    type: "District",
    recommendation:
      "District score is below target — focus on top KPIs dragging performance.",
    priority: 1,
  });
}

if ((anomalyClusters?.length || 0) >= 3) {
  districtRecommendations.push({
    type: "District",
    recommendation:
      "Multiple anomaly clusters detected — investigate operational hotspots.",
    priority: 1,
  });
}

if ((forecastRanking?.[0]?.value ?? 100) < districtAverageScore) {
  districtRecommendations.push({
    type: "District",
    recommendation:
      "Forecast shows declining district score — review staffing and replenishment.",
    priority: 1,
  });
}

// -----------------------------
// DISTRICT WEEKLY SUMMARY REPORT
// -----------------------------
const weeklySummary = {
  districtId,
  generatedAt: new Date(),

  scoreSummary: {
    averageScore: districtAverageScore,
    bestStore: bestStore
      ? {
          storeId: bestStore.storeId,
          storeName: bestStore.storeName,
          score: bestStore.score,
        }
      : null,
    worstStore: worstStore
      ? {
          storeId: worstStore.storeId,
          storeName: worstStore.storeName,
          score: worstStore.score,
        }
      : null,
    trend: trendWord(districtScoreHistory["7d"], districtScoreHistory["30d"]),
  },

  kpiSummary: Object.keys(kpiComparison).map((key) => ({
    kpi: kpiComparison[key]?.label ?? key,
    averageScore: kpiComparison[key]?.averageScore ?? 0,
    tier: tierFromScore(kpiComparison[key]?.averageScore ?? 0),
    topStore: kpiRankings[key]?.[0] ?? null,
    bottomStore: kpiRankings[key]?.[kpiRankings[key].length - 1] ?? null,
  })),

  anomalySummary: {
    totalAnomalies: storeComparisons.reduce(
      (sum, s) => sum + (s.kpiAnomalies?.length || 0),
      0,
    ),
    highestAnomalyStore: anomalyRanking?.[0] ?? null,
    clusters: anomalyClusters ?? [],
  },

  forecastOutlook: {
    forecast7d: districtScoreForecast["7d"],
    forecast30d: districtScoreForecast["30d"],
    slope: districtScoreForecastSlope,
    outlook: outlookWord(districtScoreForecastSlope["30d"]),
    confidence: districtForecastConfidence,
  },

  operationalRisk: {
    score: districtOperationalRisk.score,
    tier: districtOperationalRisk.tier,
    color: districtOperationalRisk.color,
    status: riskWord(districtOperationalRisk.tier),
    factors: districtOperationalRisk.factors,
  },

  recommendations: {
    district: districtRecommendations,
    stores: storeRecommendations,
  },
};

// -----------------------------
// DISTRICT KPI VOLATILITY ANALYSIS
// -----------------------------
const districtKpiVolatility = {};

for (const key of Object.keys(kpiComparison)) {
  const label = kpiComparison[key]?.label ?? key;

  const historyValues = storeComparisons.map((s) => {
    const hist = s.kpiHistory[key] || {};
    return [
      hist["30d"] ?? s.kpis[key]?.score ?? 0,
      hist["14d"] ?? s.kpis[key]?.score ?? 0,
      hist["7d"] ?? s.kpis[key]?.score ?? 0,
      s.kpis[key]?.score ?? 0,
    ];
  });

  const storeVolatility = historyValues.map((vals, idx) => {
    const v = kpiVolatility(vals);
    return {
      storeId: storeComparisons[idx].storeId,
      storeName: storeComparisons[idx].storeName,
      volatility: v,
      tier: volatilityTier(v),
      color: volatilityColor(v),
    };
  });

  const districtVolScore = Math.round(
    storeVolatility.reduce((sum, s) => sum + s.volatility, 0) /
      storeVolatility.length,
  );

  districtKpiVolatility[key] = {
    kpi: label,
    volatilityScore: districtVolScore,
    tier: volatilityTier(districtVolScore),
    color: volatilityColor(districtVolScore),
    stores: storeVolatility,
  };
}

const districtVolatilitySummary = {
  highestVolatilityKpi: Object.values(districtKpiVolatility).sort(
    (a, b) => b.volatilityScore - a.volatilityScore,
  )[0],
  lowestVolatilityKpi: Object.values(districtKpiVolatility).sort(
    (a, b) => a.volatilityScore - b.volatilityScore,
  )[0],
  averageVolatility: Math.round(
    Object.values(districtKpiVolatility).reduce(
      (sum, k) => sum + k.volatilityScore,
      0,
    ) / Object.keys(districtKpiVolatility).length,
  ),
};

// -----------------------------
// DISTRICT RISK MITIGATION RECOMMENDATIONS
// -----------------------------
const districtRiskMitigation = [];

// 1. District-level mitigation
districtRiskMitigation.push({
  type: "District",
  priority: mitigationPriority(districtOperationalRisk.score),
  color: mitigationColor(mitigationPriority(districtOperationalRisk.score)),
  actions: [
    districtOperationalRisk.score >= 75
      ? "Urgent district-wide intervention required."
      : districtOperationalRisk.score >= 50
        ? "High operational risk — focus on top KPIs and anomaly clusters."
        : districtOperationalRisk.score >= 25
          ? "Moderate risk — monitor KPIs and address weak stores."
          : "Low risk — maintain current operational practices.",
  ],
  factors: districtOperationalRisk.factors,
});

// 2. KPI-level mitigation
const kpiMitigation = Object.keys(districtKpiVolatility).map((key) => {
  const vol = districtKpiVolatility[key];

  return {
    type: "KPI",
    kpi: vol.kpi,
    volatility: vol.volatilityScore,
    tier: vol.tier,
    color: vol.color,
    priority: mitigationPriority(vol.volatilityScore),
    actions: mitigationForKpi(key),
  };
});

// 3. Store-level mitigation
const storeRiskMitigation = storeComparisons.map((s) => {
  const anomalyCount = s.kpiAnomalies?.length || 0;

  const priority =
    anomalyCount >= 5 || s.score < 65
      ? "High"
      : anomalyCount >= 3
        ? "Medium"
        : "Low";

  return {
    type: "Store",
    storeId: s.storeId,
    storeName: s.storeName,
    score: s.score,
    anomalies: anomalyCount,
    priority,
    color: mitigationColor(priority),
    actions: [
      ...(s.score < 65
        ? ["Store score is low — review top KPIs dragging performance."]
        : []),
      ...(anomalyCount >= 4
        ? ["High anomaly count — investigate operational issues."]
        : []),
      ...(s.kpis.wasteRate?.score < 60
        ? ["High waste — audit prep accuracy and portioning."]
        : []),
      ...(s.kpis.shrinkageRate?.score < 60
        ? ["High shrinkage — audit inventory counts and deliveries."]
        : []),
      ...(s.kpis.staffingAlignment?.score < 60
        ? ["Staffing misaligned — adjust schedules to match demand."]
        : []),
    ],
  };
});

// 4. Cluster-level mitigation
const clusterMitigation = anomalyClusters.map((c) => ({
  type: "Cluster",
  storeId: c.storeId,
  storeName: c.storeName,
  anomalyCount: c.anomalyCount,
  priority: "Critical",
  color: "purple",
  actions: [
    "Investigate operational hotspot.",
    "Audit waste, shrinkage, and staffing immediately.",
    "Review store manager performance and shift execution.",
  ],
}));

// -----------------------------
// DISTRICT MONTHLY EXECUTIVE REPORT
// -----------------------------
const monthlyExecutiveReport = {
  districtId,
  generatedAt: new Date(),
  period: "Last 30 Days",

  executiveSummary: {
    averageScore: districtAverageScore,
    trend: execPhrase(
      trendWord(districtScoreHistory["7d"], districtScoreHistory["30d"]),
    ),
    riskStatus: riskPhrase(districtOperationalRisk.tier),
    outlook: outlookPhrase(districtScoreForecastSlope["30d"]),
  },

  districtScoreOverview: {
    averageScore: districtAverageScore,
    bestStore: bestStore
      ? {
          storeId: bestStore.storeId,
          storeName: bestStore.storeName,
          score: bestStore.score,
        }
      : null,
    worstStore: worstStore
      ? {
          storeId: worstStore.storeId,
          storeName: worstStore.storeName,
          score: worstStore.score,
        }
      : null,
    scoreTrend: districtScoreTrendChart,
    forecast: districtScoreForecast,
  },

  kpiOverview: {
    kpiSummary: weeklySummary.kpiSummary,
    volatility: districtVolatilitySummary,
  },

  anomalyOverview: weeklySummary.anomalySummary,

  riskOverview: {
    operationalRisk: districtOperationalRisk,
    mitigation: {
      district: districtRiskMitigation,
      kpis: kpiMitigation,
      stores: storeRiskMitigation,
      clusters: clusterMitigation,
    },
  },

  recommendations: weeklySummary.recommendations,
};

// -----------------------------
// DISTRICT QUARTERLY EXECUTIVE REPORT
// -----------------------------
const quarterlyExecutiveReport = {
  districtId,
  generatedAt: new Date(),
  period: "Last 90 Days",

  // 1. Quarterly Executive Summary
  executiveSummary: {
    averageScore: districtAverageScore,
    trend: quarterPhrase(
      trendWord(districtScoreHistory["7d"], districtScoreHistory["30d"]),
    ),
    riskStatus: quarterRiskPhrase(districtOperationalRisk.tier),
    outlook: quarterOutlookPhrase(districtScoreForecastSlope["30d"]),
  },

  // 2. Quarterly District Score Overview
  districtScoreOverview: {
    averageScore: districtAverageScore,
    bestStore: bestStore
      ? {
          storeId: bestStore.storeId,
          storeName: bestStore.storeName,
          score: bestStore.score,
        }
      : null,
    worstStore: worstStore
      ? {
          storeId: worstStore.storeId,
          storeName: worstStore.storeName,
          score: worstStore.score,
        }
      : null,
    quarterlyTrend: districtScoreTrendChart,
    forecast: districtScoreForecast,
    predictiveRisk: districtPredictiveRisk,
  },

  // 3. KPI Performance Overview
  kpiPerformance: Object.keys(kpiComparison).map((key) => {
    const kpi = kpiComparison[key] || {};
    const vol = districtKpiVolatility[key] || {};

    return {
      kpi: kpi.label ?? key,
      averageScore: kpi.averageScore ?? 0,
      tier: tierFromScore(kpi.averageScore ?? 0),
      volatility: vol.volatilityScore ?? 0,
      volatilityTier: vol.tier ?? "Low",
      topStore: kpiRankings[key]?.[0] ?? null,
      bottomStore: kpiRankings[key]?.[kpiRankings[key].length - 1] ?? null,
    };
  }),

  // 4. Volatility & Stability Analysis
  volatilityAnalysis: {
    highestVolatilityKpi: districtVolatilitySummary.highestVolatilityKpi,
    lowestVolatilityKpi: districtVolatilitySummary.lowestVolatilityKpi,
    averageVolatility: districtVolatilitySummary.averageVolatility,

    volatilityByStore: storeComparisons.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,

      volatility: Object.keys(s.kpiHistory || {}).reduce((sum, k) => {
        const hist = s.kpiHistory[k] || {};
        const vals = [
          hist["30d"] ?? s.kpis[k]?.score ?? 0,
          hist["14d"] ?? s.kpis[k]?.score ?? 0,
          hist["7d"] ?? s.kpis[k]?.score ?? 0,
          s.kpis[k]?.score ?? 0,
        ];
        return sum + kpiVolatility(vals);
      }, 0),
    })),
  },

  // 5. Operational Risk Overview
  operationalRisk: {
    score: districtOperationalRisk.score,
    tier: districtOperationalRisk.tier,
    color: districtOperationalRisk.color,
    factors: districtOperationalRisk.factors,
  },

  // 6. Forecast Outlook
  forecastOutlook: {
    forecast7d: districtScoreForecast["7d"],
    forecast30d: districtScoreForecast["30d"],
    slope: districtScoreForecastSlope,
    confidence: districtForecastConfidence,
  },

  // 7. Anomaly & Cluster Review
  anomalyReview: {
    totalAnomalies: storeComparisons.reduce(
      (sum, s) => sum + (s.kpiAnomalies?.length || 0),
      0,
    ),
    clusters: anomalyClusters ?? [],
    highestAnomalyStore: anomalyRanking?.[0] ?? null,
  },

  // 8. Store-Level Highlights
  storeHighlights: storeComparisons.map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    score: s.score,
    anomalies: s.kpiAnomalies?.length || 0,
    riskTier: mitigationPriority(s.score),
    kpiWeaknesses: Object.keys(s.kpis || {})
      .filter((k) => (s.kpis[k]?.score ?? 100) < 70)
      .map((k) => s.kpis[k]?.label ?? k),
  })),

  // 9. Strategic Recommendations
  strategicRecommendations: {
    district: districtRiskMitigation,
    kpi: kpiMitigation,
    stores: storeRiskMitigation,
    clusters: clusterMitigation,
  },

  // 10. Priority Actions for Next Month
  priorityActions: [
    ...(districtRiskMitigation[0]?.actions || []),
    ...kpiMitigation
      .filter((k) => k.priority === "High" || k.priority === "Critical")
      .map((k) => `Address volatility in ${k.kpi}.`),
    ...clusterMitigation.map((c) => `Investigate hotspot at ${c.storeName}.`),
  ],
};

// -----------------------------
// DISTRICT KPI CORRELATION ANALYSIS
// -----------------------------
const kpiKeys = Object.keys(kpiComparison);

const kpiCorrelationMatrix = {};

for (const k1 of kpiKeys) {
  kpiCorrelationMatrix[k1] = {};

  const values1 = storeComparisons.map((s) => s.kpis[k1]?.score ?? 0);

  for (const k2 of kpiKeys) {
    const values2 = storeComparisons.map((s) => s.kpis[k2]?.score ?? 0);

    const corr = correlation(values1, values2);

    kpiCorrelationMatrix[k1][k2] = {
      correlation: corr,
      tier: correlationTier(corr),
      color: correlationColor(corr),
    };
  }
}

const kpiScoreCorrelation = {};

for (const key of kpiKeys) {
  const kpiValues = storeComparisons.map((s) => s.kpis[key]?.score ?? 0);
  const scoreValues = storeComparisons.map((s) => s.score);

  const corr = correlation(kpiValues, scoreValues);

  kpiScoreCorrelation[key] = {
    kpi: kpiComparison[key]?.label ?? key,
    correlation: corr,
    tier: correlationTier(corr),
    color: correlationColor(corr),
  };
}

const kpiAnomalyCorrelation = {};

for (const key of kpiKeys) {
  const kpiValues = storeComparisons.map((s) => s.kpis[key]?.score ?? 0);
  const anomalyValues = storeComparisons.map(
    (s) => s.kpiAnomalies?.length || 0,
  );

  const corr = correlation(kpiValues, anomalyValues);

  kpiAnomalyCorrelation[key] = {
    kpi: kpiComparison[key]?.label ?? key,
    correlation: corr,
    tier: correlationTier(corr),
    color: correlationColor(corr),
  };
}

const kpiRiskCorrelation = {};

for (const key of kpiKeys) {
  const kpiValues = storeComparisons.map((s) => s.kpis[key]?.score ?? 0);
  const riskValues = storeComparisons.map((s) => {
    const anomalies = s.kpiAnomalies?.length || 0;
    return anomalies * 2 + (s.score < 70 ? 10 : 0);
  });

  const corr = correlation(kpiValues, riskValues);

  kpiRiskCorrelation[key] = {
    kpi: kpiComparison[key]?.label ?? key,
    correlation: corr,
    tier: correlationTier(corr),
    color: correlationColor(corr),
  };
}

const districtCorrelationSummary = {
  strongestKpiToScore: Object.values(kpiScoreCorrelation).sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
  )[0],
  strongestKpiToAnomalies: Object.values(kpiAnomalyCorrelation).sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
  )[0],
  strongestKpiToRisk: Object.values(kpiRiskCorrelation).sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
  )[0],
};

// -----------------------------
// DISTRICT PREDICTIVE RISK MODELING
// -----------------------------

const currentRisk = districtOperationalRisk.score;
const forecastConfidence = districtForecastConfidence.score;
const avgVolatility = districtVolatilitySummary.averageVolatility;
const anomalyPressure = anomalyRanking?.[0]?.value ?? 0;
const scoreSlope = districtScoreForecastSlope["30d"] === "down" ? 1 : 0;
const weakKpiCount = Object.values(kpiComparison).filter(
  (k) => (k.averageScore ?? 100) < 70,
).length;

const weights = {
  risk: 0.35,
  volatility: 0.2,
  anomalies: 0.2,
  slope: 0.15,
  weakKpis: 0.1,
};

const predictedRiskScore = Math.min(
  100,
  Math.round(
    currentRisk * weights.risk +
      avgVolatility * weights.volatility +
      anomalyPressure * weights.anomalies +
      scoreSlope * 15 +
      weakKpiCount * 8,
  ),
);

const predictedAnomalySpike = Math.round(
  anomalyPressure * (1 + avgVolatility / 50),
);

const predictedKpiFailures = Object.keys(kpiComparison)
  .filter((key) => {
    const vol = districtKpiVolatility[key]?.volatilityScore ?? 0;
    const avg = kpiComparison[key]?.averageScore ?? 100;
    return vol >= 25 || avg < 65;
  })
  .map((key) => kpiComparison[key]?.label ?? key);

const predictedHighRiskStores = storeComparisons
  .filter((s) => {
    const anomalies = s.kpiAnomalies?.length || 0;
    const score = s.score;
    const vol = Object.keys(s.kpiHistory || {}).reduce((sum, k) => {
      const hist = s.kpiHistory[k] || {};
      const vals = [
        hist["30d"] ?? s.kpis[k]?.score ?? 0,
        hist["14d"] ?? s.kpis[k]?.score ?? 0,
        hist["7d"] ?? s.kpis[k]?.score ?? 0,
        s.kpis[k]?.score ?? 0,
      ];
      return sum + kpiVolatility(vals);
    }, 0);
    return anomalies >= 4 || score < 65 || vol >= 30;
  })
  .map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    score: s.score,
    anomalies: s.kpiAnomalies?.length || 0,
  }));

const districtPredictiveRisk = {
  score: predictedRiskScore,
  tier: riskPredictTier(predictedRiskScore),
  color: riskPredictColor(riskPredictTier(predictedRiskScore)),
  confidence: forecastConfidence,
  predictedAnomalySpike,
  predictedKpiFailures,
  predictedHighRiskStores,
  factors: {
    currentRisk,
    avgVolatility,
    anomalyPressure,
    scoreSlope,
    weakKpiCount,
  },
};

// -----------------------------
// DISTRICT QUARTERLY EXECUTIVE REPORT
// -----------------------------
const quarterlyExecutiveReport = {
  districtId,
  generatedAt: new Date(),
  period: "Last 90 Days",

  // 1. Quarterly Executive Summary
  executiveSummary: {
    averageScore: districtAverageScore,
    trend: quarterPhrase(
      trendWord(districtScoreHistory["7d"], districtScoreHistory["30d"]),
    ),
    riskStatus: quarterRiskPhrase(districtOperationalRisk.tier),
    outlook: quarterOutlookPhrase(districtScoreForecastSlope["30d"]),
  },

  // 2. Quarterly District Score Overview
  districtScoreOverview: {
    averageScore: districtAverageScore,
    bestStore: bestStore
      ? {
          storeId: bestStore.storeId,
          storeName: bestStore.storeName,
          score: bestStore.score,
        }
      : null,
    worstStore: worstStore
      ? {
          storeId: worstStore.storeId,
          storeName: worstStore.storeName,
          score: worstStore.score,
        }
      : null,
    quarterlyTrend: districtScoreTrendChart,
    forecast: districtScoreForecast,
    predictiveRisk: districtPredictiveRisk,
  },

  // 3. Quarterly KPI Performance Overview
  kpiPerformance: Object.keys(kpiComparison).map((key) => {
    const kpi = kpiComparison[key] || {};
    const vol = districtKpiVolatility[key] || {};

    return {
      kpi: kpi.label ?? key,
      averageScore: kpi.averageScore ?? 0,
      tier: tierFromScore(kpi.averageScore ?? 0),
      volatility: vol.volatilityScore ?? 0,
      volatilityTier: vol.tier ?? "Low",
      correlationToScore: kpiScoreCorrelation[key] || null,
      correlationToRisk: kpiRiskCorrelation[key] || null,
      topStore: kpiRankings[key]?.[0] ?? null,
      bottomStore: kpiRankings[key]?.[kpiRankings[key].length - 1] ?? null,
    };
  }),

  // 4. Quarterly Volatility & Stability Analysis
  volatilityAnalysis: {
    highestVolatilityKpi: districtVolatilitySummary.highestVolatilityKpi,
    lowestVolatilityKpi: districtVolatilitySummary.lowestVolatilityKpi,
    averageVolatility: districtVolatilitySummary.averageVolatility,
    volatilityByStore: storeComparisons.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      volatility: Object.keys(s.kpiHistory || {}).reduce((sum, k) => {
        const hist = s.kpiHistory[k] || {};
        const vals = [
          hist["30d"] ?? s.kpis[k]?.score ?? 0,
          hist["14d"] ?? s.kpis[k]?.score ?? 0,
          hist["7d"] ?? s.kpis[k]?.score ?? 0,
          s.kpis[k]?.score ?? 0,
        ];
        return sum + kpiVolatility(vals);
      }, 0),
    })),
  },

  // 5. Quarterly Operational Risk Overview
  operationalRisk: {
    score: districtOperationalRisk.score,
    tier: districtOperationalRisk.tier,
    color: districtOperationalRisk.color,
    predictiveRisk: districtPredictiveRisk,
    factors: districtOperationalRisk.factors,
  },

  // 6. Quarterly Forecast Outlook
  forecastOutlook: {
    forecast7d: districtScoreForecast["7d"],
    forecast30d: districtScoreForecast["30d"],
    slope: districtScoreForecastSlope,
    confidence: districtForecastConfidence,
    predictiveRisk: districtPredictiveRisk,
  },

  // 7. Quarterly Anomaly & Cluster Review
  anomalyReview: {
    totalAnomalies: storeComparisons.reduce(
      (sum, s) => sum + (s.kpiAnomalies?.length || 0),
      0,
    ),
    clusters: anomalyClusters ?? [],
    highestAnomalyStore: anomalyRanking?.[0] ?? null,
    predictedAnomalySpike: districtPredictiveRisk.predictedAnomalySpike,
  },

  // 8. Quarterly Store-Level Highlights
  storeHighlights: storeComparisons.map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    score: s.score,
    anomalies: s.kpiAnomalies?.length || 0,
    riskTier: mitigationPriority(s.score),
    kpiWeaknesses: Object.keys(s.kpis || {})
      .filter((k) => (s.kpis[k]?.score ?? 100) < 70)
      .map((k) => s.kpis[k]?.label ?? k),
    predictedRisk:
      districtPredictiveRisk.predictedHighRiskStores.find(
        (p) => p.storeId === s.storeId,
      ) || null,
  })),

  // 9. Quarterly Strategic Recommendations
  strategicRecommendations: {
    district: districtRiskMitigation,
    kpi: kpiMitigation,
    stores: storeRiskMitigation,
    clusters: clusterMitigation,
    predictive: {
      predictedRiskScore: districtPredictiveRisk.score,
      predictedKpiFailures: districtPredictiveRisk.predictedKpiFailures,
      predictedHighRiskStores: districtPredictiveRisk.predictedHighRiskStores,
    },
  },

  // 10. Priority Actions for Next Quarter
  priorityActions: [
    ...(districtRiskMitigation[0]?.actions || []),
    ...kpiMitigation
      .filter((k) => k.priority === "High" || k.priority === "Critical")
      .map((k) => `Address volatility in ${k.kpi}.`),
    ...clusterMitigation.map((c) => `Investigate hotspot at ${c.storeName}.`),
    ...(districtPredictiveRisk.score >= 50
      ? ["Prepare district for elevated operational risk next quarter."]
      : []),
  ],
};

// -----------------------------
// DISTRICT KPI DEPENDENCY GRAPH
// -----------------------------
const dependencyEdges = [];

// KPI ↔ KPI dependencies
for (const k1 of Object.keys(kpiCorrelationMatrix)) {
  for (const k2 of Object.keys(kpiCorrelationMatrix[k1])) {
    const corr = kpiCorrelationMatrix[k1][k2].correlation;

    dependencyEdges.push({
      from: kpiComparison[k1]?.label ?? k1,
      to: kpiComparison[k2]?.label ?? k2,
      correlation: corr,
      strength: dependencyStrength(corr),
      direction: dependencyDirection(corr),
      color: dependencyColor(corr),
      weight: Math.abs(corr),
    });
  }
}

// KPI ↔ Score dependencies
for (const key of Object.keys(kpiScoreCorrelation)) {
  const corr = kpiScoreCorrelation[key].correlation;

  dependencyEdges.push({
    from: kpiComparison[key]?.label ?? key,
    to: "District Score",
    correlation: corr,
    strength: dependencyStrength(corr),
    direction: dependencyDirection(corr),
    color: dependencyColor(corr),
    weight: Math.abs(corr),
  });
}

// KPI ↔ Anomaly dependencies
for (const key of Object.keys(kpiAnomalyCorrelation)) {
  const corr = kpiAnomalyCorrelation[key].correlation;

  dependencyEdges.push({
    from: kpiComparison[key]?.label ?? key,
    to: "Anomalies",
    correlation: corr,
    strength: dependencyStrength(corr),
    direction: dependencyDirection(corr),
    color: dependencyColor(corr),
    weight: Math.abs(corr),
  });
}

// KPI ↔ Risk dependencies
for (const key of Object.keys(kpiRiskCorrelation)) {
  const corr = kpiRiskCorrelation[key].correlation;

  dependencyEdges.push({
    from: kpiComparison[key]?.label ?? key,
    to: "Operational Risk",
    correlation: corr,
    strength: dependencyStrength(corr),
    direction: dependencyDirection(corr),
    color: dependencyColor(corr),
    weight: Math.abs(corr),
  });
}

const dependencyNodes = [
  ...Object.keys(kpiComparison).map((key) => ({
    id: kpiComparison[key]?.label ?? key,
    type: "KPI",
  })),
  { id: "District Score", type: "Score" },
  { id: "Anomalies", type: "Anomaly" },
  { id: "Operational Risk", type: "Risk" },
];

const districtKpiDependencyGraph = {
  nodes: dependencyNodes,
  edges: dependencyEdges,
  strongestDependencies: dependencyEdges
    .filter((e) => e.strength === "Strong")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10),
  weakestDependencies: dependencyEdges
    .filter((e) => e.strength === "Weak")
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 10),
};

// -----------------------------
// DISTRICT ANNUAL EXECUTIVE REPORT
// -----------------------------
const annualExecutiveReport = {
  districtId,
  generatedAt: new Date(),
  period: "Last 365 Days",

  // 1. Annual Executive Summary
  executiveSummary: {
    averageScore: districtAverageScore,
    trend: annualPhrase(
      trendWord(districtScoreHistory["30d"], districtScoreHistory["7d"]),
    ),
    riskStatus: annualRiskPhrase(districtOperationalRisk.tier),
    outlook: annualOutlookPhrase(districtScoreForecastSlope["30d"]),
  },

  // 2. Annual District Score Overview
  districtScoreOverview: {
    averageScore: districtAverageScore,
    bestStore: bestStore
      ? {
          storeId: bestStore.storeId,
          storeName: bestStore.storeName,
          score: bestStore.score,
        }
      : null,
    worstStore: worstStore
      ? {
          storeId: worstStore.storeId,
          storeName: worstStore.storeName,
          score: worstStore.score,
        }
      : null,
    annualTrend: districtScoreTrendChart,
    forecast: districtScoreForecast,
    predictiveRisk: districtPredictiveRisk,
  },

  // 3. Annual KPI Performance Overview
  kpiPerformance: Object.keys(kpiComparison).map((key) => {
    const kpi = kpiComparison[key] || {};
    const vol = districtKpiVolatility[key] || {};

    return {
      kpi: kpi.label ?? key,
      averageScore: kpi.averageScore ?? 0,
      tier: tierFromScore(kpi.averageScore ?? 0),
      volatility: vol.volatilityScore ?? 0,
      volatilityTier: vol.tier ?? "Low",
      correlationToScore: kpiScoreCorrelation[key] || null,
      correlationToRisk: kpiRiskCorrelation[key] || null,
      topStore: kpiRankings[key]?.[0] ?? null,
      bottomStore: kpiRankings[key]?.[kpiRankings[key].length - 1] ?? null,
    };
  }),

  // 4. Annual Volatility & Stability Analysis
  volatilityAnalysis: {
    highestVolatilityKpi: districtVolatilitySummary.highestVolatilityKpi,
    lowestVolatilityKpi: districtVolatilitySummary.lowestVolatilityKpi,
    averageVolatility: districtVolatilitySummary.averageVolatility,

    volatilityByStore: storeComparisons.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      volatility: Object.keys(s.kpiHistory || {}).reduce((sum, k) => {
        const hist = s.kpiHistory[k] || {};
        const vals = [
          hist["30d"] ?? s.kpis[k]?.score ?? 0,
          hist["14d"] ?? s.kpis[k]?.score ?? 0,
          hist["7d"] ?? s.kpis[k]?.score ?? 0,
          s.kpis[k]?.score ?? 0,
        ];
        return sum + kpiVolatility(vals);
      }, 0),
    })),
  },

  // 5. Annual Operational Risk Overview
  operationalRisk: {
    score: districtOperationalRisk.score,
    tier: districtOperationalRisk.tier,
    color: districtOperationalRisk.color,
    predictiveRisk: districtPredictiveRisk,
    factors: districtOperationalRisk.factors,
  },

  // 6. Annual Forecast Outlook
  forecastOutlook: {
    forecast7d: districtScoreForecast["7d"],
    forecast30d: districtScoreForecast["30d"],
    slope: districtScoreForecastSlope,
    confidence: districtForecastConfidence,
    predictiveRisk: districtPredictiveRisk,
  },

  // 7. Annual Anomaly Review
  anomalyReview: {
    totalAnomalies: storeComparisons.reduce(
      (sum, s) => sum + (s.kpiAnomalies?.length || 0),
      0,
    ),
    clusters: anomalyClusters ?? [],
    highestAnomalyStore: anomalyRanking?.[0] ?? null,
    predictedAnomalySpike: districtPredictiveRisk.predictedAnomalySpike,
  },

  // 8. Annual Store-Level Highlights
  storeHighlights: storeComparisons.map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    score: s.score,
    anomalies: s.kpiAnomalies?.length || 0,
    riskTier: mitigationPriority(s.score),
    kpiWeaknesses: Object.keys(s.kpis || {})
      .filter((k) => (s.kpis[k]?.score ?? 100) < 70)
      .map((k) => s.kpis[k]?.label ?? k),
    predictedRisk:
      districtPredictiveRisk.predictedHighRiskStores.find(
        (p) => p.storeId === s.storeId,
      ) || null,
  })),

  // 9. Annual Strategic Recommendations
  strategicRecommendations: {
    district: districtRiskMitigation,
    kpi: kpiMitigation,
    stores: storeRiskMitigation,
    clusters: clusterMitigation,
    predictive: {
      predictedRiskScore: districtPredictiveRisk.score,
      predictedKpiFailures: districtPredictiveRisk.predictedKpiFailures,
      predictedHighRiskStores: districtPredictiveRisk.predictedHighRiskStores,
    },
  },

  // 10. Priority Actions for Next Year
  priorityActions: [
    ...(districtRiskMitigation[0]?.actions || []),
    ...kpiMitigation
      .filter((k) => k.priority === "High" || k.priority === "Critical")
      .map((k) => `Address volatility in ${k.kpi}.`),
    ...clusterMitigation.map((c) => `Investigate hotspot at ${c.storeName}.`),
    ...(districtPredictiveRisk.score >= 50
      ? ["Prepare district for elevated operational risk next fiscal year."]
      : []),
  ],
};

// -----------------------------
// DISTRICT KPI INFLUENCE SIMULATION
// -----------------------------
const influencePercents = [-20, -10, -5, 5, 10, 20];

const kpiInfluenceSimulation = {};

for (const key of Object.keys(kpiComparison)) {
  const label = kpiComparison[key]?.label ?? key;

  const corrScore = kpiScoreCorrelation[key]?.correlation ?? 0;
  const corrRisk = kpiRiskCorrelation[key]?.correlation ?? 0;
  const corrAnomaly = kpiAnomalyCorrelation[key]?.correlation ?? 0;

  kpiInfluenceSimulation[key] = {
    kpi: label,
    baseScore: kpiComparison[key]?.averageScore ?? 0,
    simulations: influencePercents.map((pct) => {
      const scoreInfluence = influenceScore(corrScore, pct / 100);
      const riskInfluence = influenceScore(corrRisk, pct / 100);
      const anomalyInfluence = influenceScore(corrAnomaly, pct / 100);

      return {
        percentChange: pct,
        projectedDistrictScore: simulateChange(
          districtAverageScore,
          scoreInfluence * 100,
        ),
        projectedRisk: simulateChange(
          districtOperationalRisk.score,
          riskInfluence * 100,
        ),
        projectedAnomalies: simulateChange(
          anomalyRanking?.[0]?.value ?? 0,
          anomalyInfluence * 100,
        ),
        influence: {
          score: {
            value: scoreInfluence,
            tier: influenceTier(scoreInfluence),
            color: influenceColor(scoreInfluence),
          },
          risk: {
            value: riskInfluence,
            tier: influenceTier(riskInfluence),
            color: influenceColor(riskInfluence),
          },
          anomalies: {
            value: anomalyInfluence,
            tier: influenceTier(anomalyInfluence),
            color: influenceColor(anomalyInfluence),
          },
        },
      };
    }),
  };
}

const districtInfluenceSummary = {
  strongestScoreInfluence: Object.keys(kpiInfluenceSimulation)
    .map((k) => ({
      kpi: kpiInfluenceSimulation[k].kpi,
      influence: Math.abs(kpiScoreCorrelation[k]?.correlation ?? 0),
    }))
    .sort((a, b) => b.influence - a.influence)[0],

  strongestRiskInfluence: Object.keys(kpiInfluenceSimulation)
    .map((k) => ({
      kpi: kpiInfluenceSimulation[k].kpi,
      influence: Math.abs(kpiRiskCorrelation[k]?.correlation ?? 0),
    }))
    .sort((a, b) => b.influence - a.influence)[0],

  strongestAnomalyInfluence: Object.keys(kpiInfluenceSimulation)
    .map((k) => ({
      kpi: kpiInfluenceSimulation[k].kpi,
      influence: Math.abs(kpiAnomalyCorrelation[k]?.correlation ?? 0),
    }))
    .sort((a, b) => b.influence - a.influence)[0],
};

// -----------------------------
// DISTRICT KPI HEATMAP LAYERS
// -----------------------------
function scoreToColor(score) {
  return score >= 90
    ? "#2ecc71" // green
    : score >= 80
      ? "#f1c40f" // yellow
      : score >= 70
        ? "#e67e22" // orange
        : score >= 60
          ? "#e74c3c" // red
          : "#8e44ad"; // critical
}

function intensityFromScore(score) {
  return Math.round((100 - score) / 10); // 0–10 scale
}

const districtKpiHeatmapLayers = {
  score: [],
  wasteRate: [],
  shrinkageRate: [],
  usageEfficiency: [],
  staffingAlignment: [],
  replenishmentCompliance: [],
  anomalies: [],
};

for (const s of storeComparisons) {
  const loc = s.dashboard.store.location;

  // Score layer
  districtKpiHeatmapLayers.score.push({
    storeId: s.storeId,
    storeName: s.storeName,
    location: loc,
    score: s.score,
    color: scoreToColor(s.score),
    intensity: intensityFromScore(s.score),
  });

  // KPI layers
  for (const key of Object.keys(s.kpis || {})) {
    districtKpiHeatmapLayers[key].push({
      storeId: s.storeId,
      storeName: s.storeName,
      location: loc,
      score: s.kpis[key]?.score ?? 0,
      color: scoreToColor(s.kpis[key]?.score ?? 0),
      intensity: intensityFromScore(s.kpis[key]?.score ?? 0),
    });
  }

  // Anomaly layer
  const anomalyCount = s.kpiAnomalies?.length || 0;

  districtKpiHeatmapLayers.anomalies.push({
    storeId: s.storeId,
    storeName: s.storeName,
    location: loc,
    anomalyCount,
    intensity: Math.min(anomalyCount, 10),
    color:
      anomalyCount >= 5
        ? "#8e44ad" // critical
        : anomalyCount >= 3
          ? "#e74c3c" // red
          : anomalyCount >= 1
            ? "#e67e22" // orange
            : "#2ecc71", // green
  });
}

// -----------------------------
// DISTRICT ANOMALY HEATMAP
// -----------------------------
const districtAnomalyHeatmap = [];

for (const s of storeComparisons) {
  const loc = s.dashboard.store.location;

  const anomalies = s.kpiAnomalies || [];
  const anomalyCount = anomalies.length;

  const color =
    anomalyCount >= 6
      ? "#8e44ad" // critical purple
      : anomalyCount >= 4
        ? "#e74c3c" // red
        : anomalyCount >= 2
          ? "#e67e22" // orange
          : anomalyCount >= 1
            ? "#f1c40f" // yellow
            : "#2ecc71"; // green

  districtAnomalyHeatmap.push({
    storeId: s.storeId,
    storeName: s.storeName,
    location: loc,
    anomalyCount,
    color,
    intensity: Math.min(anomalyCount, 10),
    anomalies: anomalies.map((a) => ({
      kpi: a.kpi,
      severity: a.severity,
      type: classifyAnomaly(a),
    })),
  });
}

// Intensity scale (0–10)
const intensity = Math.min(anomalyCount, 10);

// Breakdown by type
const typeBreakdown = {
  waste: 0,
  shrinkage: 0,
  usage: 0,
  staffing: 0,
  replenishment: 0,
  other: 0,
};

(anomalies || []).forEach((a) => {
  const type = classifyAnomaly(a);
  typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
});

districtAnomalyHeatmap.push({
  storeId: s.storeId,
  storeName: s.storeName,
  storeNumber: s.storeNumber,
  location: loc,
  anomalyCount,
  intensity,
  color,
  typeBreakdown,
});

// -----------------------------
// 2. Detect clusters AFTER heatmap is built
// -----------------------------
const anomalyClusters = detectClusters(districtAnomalyHeatmap);

// -----------------------------
// FINAL RESPONSE
// -----------------------------
res.json({
  districtId,
  districtAverageScore,
  bestStore,
  worstStore,

  stores: storeComparisons,

  // KPI + Score Comparisons
  kpiComparison,
  districtScoreTrendChart,
  districtHeatmap,
  districtKpiHeatmapLayers,

  // Rankings
  overallRanking,
  kpiRankings,
  anomalyRanking,
  forecastRanking,
  performanceTiers,

  // Forecasting
  districtScoreForecast,
  districtScoreForecastChart,
  districtScoreForecastSlope,
  districtForecastConfidence,

  // Anomalies
  districtAnomalyHeatmap,
  anomalyClusters,

  // Recommendations
  districtRecommendations,
  storeRecommendations,

  // Risk
  districtOperationalRisk,
  districtRiskMitigation,
  kpiMitigation,
  storeRiskMitigation,
  clusterMitigation,

  // Volatility
  districtKpiVolatility,
  districtVolatilitySummary,

  // Weekly / Monthly / Quarterly / Annual Reports
  weeklySummary,
  monthlyExecutiveReport,
  quarterlyExecutiveReport,
  annualExecutiveReport,

  // Correlation + Predictive Modeling
  kpiCorrelationMatrix,
  kpiScoreCorrelation,
  kpiAnomalyCorrelation,
  kpiRiskCorrelation,
  districtCorrelationSummary,
  districtPredictiveRisk,

  // Influence Simulation
  kpiInfluenceSimulation,
  districtInfluenceSummary,

  // Heatmap Layers
  districtKpiHeatmapLayers,
  districtAnomalyHeatmap,

  requestId: req.requestId,
});
