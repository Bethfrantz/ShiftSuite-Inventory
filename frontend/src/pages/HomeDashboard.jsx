import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./HomeDashboard.css";

export default function HomeDashboard() {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const navigate = useNavigate();

  async function loadData() {
    const [storesData, itemsData, categoriesData] = await Promise.all([
      API.getStores(),
      API.getItems(),
      API.getCategories(),
    ]);

    setStores(storesData);
    setItems(itemsData);
    setCategories(categoriesData);

    if (storesData.length > 0) {
      const alertsRes = await API.getAlerts(storesData[0]._id);
      setAlerts(alertsRes.alerts.slice(0, 5));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="home-page">
      <h1>Enterprise Home Dashboard</h1>

      {/* Top KPIs */}
      <div className="home-kpi-grid">
        <div className="home-kpi-card">
          <h3>Stores</h3>
          <p className="home-kpi-value">{stores.length}</p>
        </div>

        <div className="home-kpi-card">
          <h3>Items</h3>
          <p className="home-kpi-value">{items.length}</p>
        </div>

        <div className="home-kpi-card">
          <h3>Categories</h3>
          <p className="home-kpi-value">{categories.length}</p>
        </div>
      </div>

      {/* Navigation tiles */}
      <div className="home-nav-grid">
        <button
          onClick={() => navigate("/dashboard")}
          className="home-nav-card"
        >
          <h3>Store Dashboard</h3>
          <p>View KPIs and trends for a single store.</p>
        </button>

        <button
          onClick={() => navigate("/manager-dashboard")}
          className="home-nav-card"
        >
          <h3>Manager Dashboard</h3>
          <p>Multi‑store KPI overview for managers.</p>
        </button>

        <button
          onClick={() => navigate("/district-comparison")}
          className="home-nav-card"
        >
          <h3>District Comparison</h3>
          <p>Compare districts side‑by‑side.</p>
        </button>

        <button onClick={() => navigate("/reports")} className="home-nav-card">
          <h3>Reports</h3>
          <p>Inventory, waste, vendor, and usage reports.</p>
        </button>

        <button onClick={() => navigate("/waste")} className="home-nav-card">
          <h3>Waste Tracking</h3>
          <p>Record and review daily waste.</p>
        </button>

        <button
          onClick={() => navigate("/waste-cost")}
          className="home-nav-card"
        >
          <h3>Waste Cost Analysis</h3>
          <p>See financial impact of waste.</p>
        </button>

        <button onClick={() => navigate("/alerts")} className="home-nav-card">
          <h3>Store Alerts</h3>
          <p>Operational alerts and recommended actions.</p>
        </button>

        <button
          onClick={() => navigate("/count-history")}
          className="home-nav-card"
        >
          <h3>Count History</h3>
          <p>Audit trail of inventory counts.</p>
        </button>
      </div>

      {/* Latest alerts preview */}
      <div className="home-alerts-section">
        <h2>Latest Alerts (first store)</h2>

        {alerts.length === 0 && <p>No alerts.</p>}

        <div className="home-alerts-list">
          {alerts.map((a, idx) => (
            <div className={`home-alert-card severity-${a.severity}`} key={idx}>
              <div className="home-alert-header">
                <span className="home-alert-type">{a.type}</span>
                <span className="home-alert-severity">
                  {a.severity.toUpperCase()}
                </span>
              </div>
              <p>{a.message}</p>
              <p className="home-alert-time">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
