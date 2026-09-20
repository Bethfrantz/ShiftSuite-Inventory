import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/ManagerDashboard.module.css";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const [stores, setStores] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const navigate = useNavigate();

  async function loadStores() {
    const data = await API.getStores();
    setStores(stores);
  }

  async function loadDashboards() {
    const results = [];

    for (const store of stores) {
      const d = await API.getStoreDashboard(store._id);
      results.push({ store, dashboard: d });
    }

    setDashboards(results);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) loadDashboards();
  }, [stores]);

  return (
    <div className={styles.managerDashboardPage}>
      <h1>Manager Dashboard</h1>

      <div className={styles.managerGrid}>
        {dashboards.map(({ store, dashboard }) => (
          <div className={styles.managerCard} key={store._id}>
            <h2>{store.name}</h2>

            <div className={styles.storeScore}>
              Score: <span>{dashboard.storeScore}</span>
            </div>

            <div className={styles.kpiSection}>
              {Object.entries(dashboard.kpiTrendCharts).map(([key, kpi]) => (
                <div className={styles.kpiRow} key={key}>
                  <span className={styles.kpiLabel}>{kpi.label}</span>

                  <span className={`kpi-arrow ${kpi.direction}`}>
                    {kpi.direction === "up" && "▲"}
                    {kpi.direction === "down" && "▼"}
                    {kpi.direction === "flat" && "■"}
                  </span>

                  <span className={styles.kpiStrength}>{kpi.strength}</span>
                </div>
              ))}
            </div>

            <div className={styles.managerActions}>
              <button
                onClick={() => navigate(`/dashboard?store=${store._id}`)}
                className={styles.actionButton}
              >
                View Store Dashboard
              </button>

              <button
                onClick={() => navigate(`/count-history?store=${store._id}`)}
                className={styles.actionButton}
              >
                Count History
              </button>

              <button
                onClick={() => navigate(`/reports?store=${store._id}`)}
                className={styles.actionButton}
              >
                Reports
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
