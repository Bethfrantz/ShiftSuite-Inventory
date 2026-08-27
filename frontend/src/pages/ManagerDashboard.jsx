import { useEffect, useState } from "react";
import API from "../api/api";
import "./ManagerDashboard.css";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const [stores, setStores] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const navigate = useNavigate();

  async function loadStores() {
    const data = await API.getStores();
    setStores(data);
  }

  async function loadDashboards() {
    const results = [];

    for (const store of stores) {
      const d = await API.getStoreDashboard(store._id);
      results.push({ store, dashboard: d });
    }

    setDashboards(results);
  }

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) loadDashboards();
  }, [stores]);

  return (
    <div className="manager-dashboard-page">
      <h1>Manager Dashboard</h1>

      <div className="manager-grid">
        {dashboards.map(({ store, dashboard }) => (
          <div className="manager-card" key={store._id}>
            <h2>{store.name}</h2>

            <div className="store-score">
              Score: <span>{dashboard.storeScore}</span>
            </div>

            <div className="kpi-section">
              {Object.entries(dashboard.kpiTrendCharts).map(([key, kpi]) => (
                <div className="kpi-row" key={key}>
                  <span className="kpi-label">{kpi.label}</span>

                  <span className={`kpi-arrow ${kpi.direction}`}>
                    {kpi.direction === "up" && "▲"}
                    {kpi.direction === "down" && "▼"}
                    {kpi.direction === "flat" && "■"}
                  </span>

                  <span className="kpi-strength">{kpi.strength}</span>
                </div>
              ))}
            </div>

            <div className="manager-actions">
              <button
                onClick={() => navigate(`/dashboard?store=${store._id}`)}
                className="action-button"
              >
                View Store Dashboard
              </button>

              <button
                onClick={() => navigate(`/count-history?store=${store._id}`)}
                className="action-button"
              >
                Count History
              </button>

              <button
                onClick={() => navigate(`/reports?store=${store._id}`)}
                className="action-button"
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
