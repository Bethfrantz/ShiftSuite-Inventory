const express = require("express");
const router = express.Router();
const axios = require("axios");

const District = require("../models/District");

router.get("/", async (req, res) => {
  try {
    const districts = await District.find();

    if (!districts.length) {
      return res.status(404).json({ error: "No districts found" });
    }

    const base = "http://localhost:5000/api/districtDashboard";

    const dashboards = await Promise.all(
      districts.map((d) =>
        axios.get(`${base}/${d._id}`).then((r) => ({
          districtId: d._id,
          districtName: d.name,
          dashboard: r.data,
        })),
      ),
    );

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

    function mitigationForDistrictRisk(score) {
      if (score >= 75)
        return [
          "Urgent region-wide intervention required.",
          "Deploy senior ops team to top 3 districts.",
        ];
      if (score >= 50)
        return [
          "High operational risk — focus on top KPIs and anomaly clusters.",
          "Schedule district-level performance reviews.",
        ];
      if (score >= 25)
        return [
          "Moderate risk — monitor KPIs and address weak districts.",
          "Increase oversight on anomaly-heavy districts.",
        ];
      return [
        "Low risk — maintain current operational practices.",
        "Continue monitoring for early warning signals.",
      ];
    }

    function forecastScore(center, slope) {
      if (slope === "up") return center + 2;
      if (slope === "down") return center - 2;
      return center;
    }

    function forecastRisk(currentRisk, predictiveRisk) {
      return Math.round((currentRisk + predictiveRisk) / 2);
    }

    function forecastAnomalies(current, spike) {
      return Math.round(current + spike);
    }

    function forecastTier(score) {
      if (score >= 80) return "Strong";
      if (score >= 70) return "Moderate";
      return "Weak";
    }

    const districtComparisons = dashboards.map((d) => ({
      districtId: d.districtId,
      districtName: d.districtName,

      score: d.dashboard.districtAverageScore,
      bestStore: d.dashboard.bestStore,
      worstStore: d.dashboard.worstStore,

      operationalRisk: d.dashboard.districtOperationalRisk.score,
      riskTier: d.dashboard.districtOperationalRisk.tier,

      forecast30d: d.dashboard.districtScoreForecast["30d"].center,
      forecastSlope: d.dashboard.districtScoreForecastSlope["30d"],

      anomalyCount: d.dashboard.anomalySummary.totalAnomalies,
      clusters: d.dashboard.anomalySummary.clusters.length,

      volatility: d.dashboard.districtVolatilitySummary.averageVolatility,

      predictiveRisk: d.dashboard.districtPredictiveRisk.score,
    }));

    function rank(items, key) {
      return [...items]
        .sort((a, b) => b[key] - a[key])
        .map((item, i) => ({
          rank: i + 1,
          ...item,
        }));
    }

    const scoreRanking = rank(districtComparisons, "score");
    const riskRanking = rank(districtComparisons, "operationalRisk");
    const forecastRanking = rank(districtComparisons, "forecast30d");
    const anomalyRanking = rank(districtComparisons, "anomalyCount");
    const volatilityRanking = rank(districtComparisons, "volatility");
    const predictiveRiskRanking = rank(districtComparisons, "predictiveRisk");

    const districtKpiComparison = {};

    for (const d of dashboards) {
      const kpis = d.dashboard.kpiComparison;

      for (const key of Object.keys(kpis)) {
        if (!districtKpiComparison[key]) {
          districtKpiComparison[key] = {
            label: kpis[key].label,
            districts: [],
          };
        }

        districtKpiComparison[key].districts.push({
          districtId: d.districtId,
          districtName: d.districtName,
          score: kpis[key].averageScore,
          color: kpis[key].color,
          grade: kpis[key].grade,
        });
      }
    }

    const multiDistrictExecutiveSummary = {
      bestDistrict: scoreRanking[0],
      highestRiskDistrict: riskRanking[0],
      strongestForecastDistrict: forecastRanking[0],
      mostVolatileDistrict: volatilityRanking[0],
      highestAnomalyDistrict: anomalyRanking[0],
      highestPredictiveRiskDistrict: predictiveRiskRanking[0],
    };

    // -----------------------------
    // MULTI-DISTRICT FORECASTING ENGINE
    // -----------------------------
    const multiDistrictForecasting = dashboards.map((d) => {
      const dash = d.dashboard;

      const forecast7 = dash.districtScoreForecast["7d"];
      const forecast30 = dash.districtScoreForecast["30d"];

      const slope = dash.districtScoreForecastSlope["30d"];
      const predictiveRisk = dash.districtPredictiveRisk.score;
      const anomalySpike = dash.districtPredictiveRisk.predictedAnomalySpike;

      return {
        districtId: d.districtId,
        districtName: d.districtName,

        // Score Forecast
        forecastScore7d: forecastScore(forecast7.center, slope),
        forecastScore30d: forecastScore(forecast30.center, slope),
        forecastTier: forecastTier(forecast30.center),

        // Risk Forecast
        forecastRisk: forecastRisk(
          dash.districtOperationalRisk.score,
          predictiveRisk,
        ),

        // Anomaly Forecast
        forecastAnomalies: forecastAnomalies(
          dash.anomalySummary.totalAnomalies,
          anomalySpike,
        ),

        // Forecast Confidence
        forecastConfidence: dash.districtForecastConfidence.score,

        // KPI Forecast (based on volatility + correlation)
        kpiForecast: Object.keys(dash.kpiComparison).map((key) => {
          const kpi = dash.kpiComparison[key];
          const vol = dash.districtKpiVolatility[key].volatilityScore;
          const corr = dash.kpiScoreCorrelation[key].correlation;

          const projected = +(kpi.averageScore + corr * (vol / 10)).toFixed(2);

          return {
            kpi: kpi.label,
            current: kpi.averageScore,
            projected,
            volatility: vol,
            correlation: corr,
          };
        }),
      };
    });

    const forecastScoreRanking = rank(
      multiDistrictForecasting,
      "forecastScore30d",
    );
    const forecastRiskRanking = rank(multiDistrictForecasting, "forecastRisk");
    const forecastAnomalyRanking = rank(
      multiDistrictForecasting,
      "forecastAnomalies",
    );
    const forecastConfidenceRanking = rank(
      multiDistrictForecasting,
      "forecastConfidence",
    );

    const multiDistrictForecastExecutiveSummary = {
      strongestForecastDistrict: forecastScoreRanking[0],
      highestForecastRiskDistrict: forecastRiskRanking[0],
      highestForecastAnomalyDistrict: forecastAnomalyRanking[0],
      strongestForecastConfidenceDistrict: forecastConfidenceRanking[0],
    };

    // -----------------------------
    // MULTI-DISTRICT RISK MITIGATION ENGINE
    // -----------------------------
    const multiDistrictRiskMitigation = {
      districts: districtComparisons.map((d) => {
        const priority = mitigationPriority(d.operationalRisk);

        return {
          districtId: d.districtId,
          districtName: d.districtName,
          score: d.operationalRisk,
          riskTier: d.riskTier,
          priority,
          color: mitigationColor(priority),
          actions: mitigationForDistrictRisk(d.operationalRisk),
        };
      }),

      highestRiskDistrictPlan: (() => {
        const highest = riskRanking[0];
        const priority = mitigationPriority(highest.operationalRisk);

        return {
          districtId: highest.districtId,
          districtName: highest.districtName,
          score: highest.operationalRisk,
          riskTier: highest.riskTier,
          priority,
          color: mitigationColor(priority),
          actions: mitigationForDistrictRisk(highest.operationalRisk),
        };
      })(),
    };

    res.json({
      districts: districtComparisons,

      scoreRanking,
      riskRanking,
      forecastRanking,
      anomalyRanking,
      volatilityRanking,
      predictiveRiskRanking,

      districtKpiComparison,
      multiDistrictExecutiveSummary,
      multiDistrictForecasting,
      forecastScoreRanking,
      forecastRiskRanking,
      forecastAnomalyRanking,
      forecastConfidenceRanking,
      multiDistrictForecastExecutiveSummary,
      multiDistrictRiskMitigation,
    });
  } catch (err) {
    console.error("Multi-district comparison error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate multi-district comparison" });
  }
});

// Missing export — now added
module.exports = router;
