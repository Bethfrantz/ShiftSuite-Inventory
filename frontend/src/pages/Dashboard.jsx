import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/Dashboard.module.css";

export default function Dashboard() {
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  async function loadStores() {
    const data = await API.getStores();
    setStores(stores);
  }

  async function loadDashboard() {
    if (!storeId) return;
    const data = await API.getStoreDashboard(storeId);
    setDashboard(data);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [storeId]);

  return (
    <div className={styles.dashboardPage}>
      <h1>Store Dashboard</h1>

      <div className={styles.dashboardControls}>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {dashboard && (
          <button
            className={styles.printButton}
            onClick={() => window.open(`/print/dashboard/${storeId}`, "_blank")}
          >
            Print Dashboard
          </button>
        )}
      </div>

      {!dashboard && <p>Select a store to view KPIs.</p>}

      {dashboard && (
        <div className={styles.dashboardGrid}>
          {/* Store Score */}
          <div className={styles.scoreCard}>
            <h2>Store Score</h2>
            <div className={styles.scoreValue}>{dashboard.storeScore}</div>
          </div>

          {/* KPI Cards */}
          {Object.entries(dashboard.kpiTrendCharts).map(([key, kpi]) => (
            <div className={styles.kpiCard} key={key}>
              <h3>{kpi.label}</h3>

              <div className={styles.kpiTrend}>
                <span
                  className={`${styles.trendArrow} ${styles[kpi.direction]}`}
                >
                  {kpi.direction === "up" && "▲"}
                  {kpi.direction === "down" && "▼"}
                  {kpi.direction === "flat" && "■"}
                </span>

                <span className={styles.trendStrength}>{kpi.strength}</span>
              </div>

              <div className={styles.kpiChart}>
                {kpi.chartSeries.map((point) => (
                  <div
                    key={point.label}
                    className={styles.chartBar}
                    style={{
                      height: `${point.value / 50}px`,
                      background: kpi.color,
                    }}
                  >
                    <span className={styles.chartLabel}>{point.label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.kpiScore}>
                Score: {kpi.scoreSeries[0].score} → {kpi.scoreSeries[2].score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
