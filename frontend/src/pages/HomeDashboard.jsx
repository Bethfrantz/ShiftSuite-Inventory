import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../styles/pages/HomeDashboard.module.css";

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
    <div className={styles.homePage}>
      <h1>Enterprise Home Dashboard</h1>

      <div className={styles.homeKpiGrid}>
        <div className={styles.homeKpiCard}>
          <h3>Stores</h3>
          <p className={styles.homeKpiValue}>{stores.length}</p>
        </div>

        <div className={styles.homeKpiCard}>
          <h3>Items</h3>
          <p className={styles.homeKpiValue}>{items.length}</p>
        </div>

        <div className={styles.homeKpiCard}>
          <h3>Categories</h3>
          <p className={styles.homeKpiValue}>{categories.length}</p>
        </div>
      </div>

      <div className={styles.homeNavGrid}>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.homeNavCard}
        >
          <h3>Store Dashboard</h3>
          <p>View KPIs and trends for a single store.</p>
        </button>

        <button
          onClick={() => navigate("/manager-dashboard")}
          className={styles.homeNavCard}
        >
          <h3>Manager Dashboard</h3>
          <p>Multi‑store KPI overview for managers.</p>
        </button>

        <button
          onClick={() => navigate("/district-comparison")}
          className={styles.homeNavCard}
        >
          <h3>District Comparison</h3>
          <p>Compare districts side‑by‑side.</p>
        </button>

        <button
          onClick={() => navigate("/reports")}
          className={styles.homeNavCard}
        >
          <h3>Reports</h3>
          <p>Inventory, waste, vendor, and usage reports.</p>
        </button>

        <button
          onClick={() => navigate("/waste")}
          className={styles.homeNavCard}
        >
          <h3>Waste Tracking</h3>
          <p>Record and review daily waste.</p>
        </button>

        <button
          onClick={() => navigate("/waste-cost")}
          className={styles.homeNavCard}
        >
          <h3>Waste Cost Analysis</h3>
          <p>See financial impact of waste.</p>
        </button>

        <button
          onClick={() => navigate("/alerts")}
          className={styles.homeNavCard}
        >
          <h3>Store Alerts</h3>
          <p>Operational alerts and recommended actions.</p>
        </button>

        <button
          onClick={() => navigate("/count-history")}
          className={styles.homeNavCard}
        >
          <h3>Count History</h3>
          <p>Audit trail of inventory counts.</p>
        </button>
      </div>

      <div className={styles.homeAlertsSection}>
        <h2>Latest Alerts (first store)</h2>

        {alerts.length === 0 && <p>No alerts.</p>}

        <div className={styles.homeAlertsList}>
          {alerts.map((a, idx) => (
            <div
              className={`${styles.homeAlertCard} ${styles[`severity-${a.severity}`]}`}
              key={idx}
            >
              <div className={styles.homeAlertHeader}>
                <span className={styles.homeAlertType}>{a.type}</span>
                <span className={styles.homeAlertSeverity}>
                  {a.severity.toUpperCase()}
                </span>
              </div>
              <p>{a.message}</p>
              <p className={styles.homeAlertTime}>
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
