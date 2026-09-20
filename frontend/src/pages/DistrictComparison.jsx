import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/DistrictComparison.module.css";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadComparison();
  }, []);

  if (!comparison) return <div>Loading...</div>;

  return (
    <div className={styles.districtPage}>
      <h1>District Comparison Dashboard</h1>

      {/* Executive Summary */}
      <div className={styles.executiveSummary}>
        <h2>Executive Summary</h2>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Best District</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.bestDistrict
                  .districtName
              }
            </p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Highest Risk</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.highestRiskDistrict
                  .districtName
              }
            </p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Strongest Forecast</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary
                  .strongestForecastDistrict.districtName
              }
            </p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Most Volatile</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.mostVolatileDistrict
                  .districtName
              }
            </p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Highest Anomalies</h3>
            <p>
              {
                comparison.multiDistrictExecutiveSummary.highestAnomalyDistrict
                  .districtName
              }
            </p>
          </div>

          <div className={styles.summaryCard}>
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
      <div className={styles.rankingSection}>
        <h2>District Rankings</h2>

        <div className={styles.rankingGrid}>
          <div className={styles.rankingCard}>
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

          <div className={styles.rankingCard}>
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

          <div className={styles.rankingCard}>
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

          <div className={styles.rankingCard}>
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

          <div className={styles.rankingCard}>
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

          <div className={styles.rankingCard}>
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
      <div className={styles.kpiSection}>
        <h2>KPI Comparison Across Districts</h2>

        <div className={styles.kpiGrid}>
          {Object.entries(comparison.districtKpiComparison).map(
            ([key, kpi]) => (
              <div className={styles.kpiCard} key={key}>
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
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>

        <div className={styles.quickGrid}>
          {districts.map((d) => (
            <button
              key={d.districtId}
              className={styles.quickButton}
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
