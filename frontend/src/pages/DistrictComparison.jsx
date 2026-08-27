import { useEffect, useState } from "react";
import API from "../api/api";
import "./DistrictComparison.css";
import { useNavigate } from "react-router-dom";

export default function DistrictComparison() {
  const [districts, setDistricts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const navigate = useNavigate();

  async function loadComparison() {
    const data = await API.getDistrictComparison();
    setComparison(data);
    setDistricts(data.districts);
  }

  useEffect(() => {
    loadComparison();
  }, []);

  if (!comparison) return <div>Loading...</div>;

  return (
    <div className="district-page">
      <h1>District Comparison Dashboard</h1>

      {/* Executive Summary */}
      <div className="executive-summary">
        <h2>Executive Summary</h2>

        <div className="summary-grid">
          <div className="summary-card">
            <h3>Best District</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.bestDistrict
                  .districtName
              }
            </p>
          </div>

          <div className="summary-card">
            <h3>Highest Risk</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.highestRiskDistrict
                  .districtName
              }
            </p>
          </div>

          <div className="summary-card">
            <h3>Strongest Forecast</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary
                  .strongestForecastDistrict.districtName
              }
            </p>
          </div>

          <div className="summary-card">
            <h3>Most Volatile</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.mostVolatileDistrict
                  .districtName
              }
            </p>
          </div>

          <div className="summary-card">
            <h3>Highest Anomalies</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.highestAnomalyDistrict
                  .districtName
              }
            </p>
          </div>

          <div className="summary-card">
            <h3>Highest Predictive Risk</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary
                  .highestPredictiveRiskDistrict.districtName
              }
            </p>
          </div>
        </div>
      </div>

      {/* Ranking Tables */}
      <div className="ranking-section">
        <h2>District Rankings</h2>

        <div className="ranking-grid">
          <div className="ranking-card">
            <h3>Score Ranking</h3>
            <table>
              <tbody>
                {comparison.scoreRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-card">
            <h3>Operational Risk</h3>
            <table>
              <tbody>
                {comparison.riskRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.operationalRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-card">
            <h3>Forecast</h3>
            <table>
              <tbody>
                {comparison.forecastRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.forecast30d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-card">
            <h3>Anomalies</h3>
            <table>
              <tbody>
                {comparison.anomalyRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.anomalyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-card">
            <h3>Volatility</h3>
            <table>
              <tbody>
                {comparison.volatilityRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.volatility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ranking-card">
            <h3>Predictive Risk</h3>
            <table>
              <tbody>
                {comparison.predictiveRiskRanking.map((d) => (
                  <tr key={d.districtId}>
                    <td>{d.rank}</td>
                    <td>{d.districtName}</td>
                    <td>{d.predictiveRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KPI Comparison Grid */}
      <div className="kpi-section">
        <h2>KPI Comparison Across Districts</h2>

        <div className="kpi-grid">
          {Object.entries(comparison.districtKpiComparison).map(
            ([key, kpi]) => (
              <div className="kpi-card" key={key}>
                <h3>{kpi.label}</h3>

                <table>
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Score</th>
                      <th>Grade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {kpi.districts.map((d) => (
                      <tr key={d.districtId}>
                        <td>{d.districtName}</td>
                        <td>{d.score}</td>
                        <td>{d.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>

        <div className="quick-grid">
          {districts.map((d) => (
            <button
              key={d.districtId}
              className="quick-button"
              onClick={() => navigate(`/dashboard?district=${d.districtId}`)}
            >
              View {d.districtName} Dashboard
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
