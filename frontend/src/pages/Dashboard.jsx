import { useEffect, useState } from "react";
import API from "../api/api";
import "./Dashboard.css";

export default function Dashboard() {
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  async function loadStores() {
    const data = await API.getStores();
    setStores(data);
  }

  async function loadDashboard() {
    if (!storeId) return;
    const data = await API.getStoreDashboard(storeId);
    setDashboard(data);
  }

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [storeId]);

  return (
    <div className="dashboard-page">
      <h1>Store Dashboard</h1>

      <div className="dashboard-controls">
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
            className="print-button"
            onClick={() => window.open(`/print/dashboard/${storeId}`, "_blank")}
          >
            Print Dashboard
          </button>
        )}
      </div>

      {!dashboard && <p>Select a store to view KPIs.</p>}

      {dashboard && (
        <div className="dashboard-grid">
          {/* Store Score */}
          <div className="score-card">
            <h2>Store Score</h2>
            <div className="score-value">{dashboard.storeScore}</div>
          </div>

          {/* KPI Cards */}
          {Object.entries(dashboard.kpiTrendCharts).map(([key, kpi]) => (
            <div className="kpi-card" key={key}>
              <h3>{kpi.label}</h3>

              <div className="kpi-trend">
                <span className={`trend-arrow ${kpi.direction}`}>
                  {kpi.direction === "up" && "▲"}
                  {kpi.direction === "down" && "▼"}
                  {kpi.direction === "flat" && "■"}
                </span>

                <span className="trend-strength">{kpi.strength}</span>
              </div>

              <div className="kpi-chart">
                {kpi.chartSeries.map((point) => (
                  <div
                    key={point.label}
                    className="chart-bar"
                    style={{
                      height: `${point.value / 50}px`,
                      background: kpi.color,
                    }}
                  >
                    <span className="chart-label">{point.label}</span>
                  </div>
                ))}
              </div>

              <div className="kpi-score">
                Score: {kpi.scoreSeries[0].score} → {kpi.scoreSeries[2].score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
