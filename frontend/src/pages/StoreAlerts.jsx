import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/StoreAlerts.module.css";
import { useNavigate } from "react-router-dom";

export default function StoreAlerts() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [alerts, setAlerts] = useState([]);

  const navigate = useNavigate();

  async function loadStores() {
    const data = await API.getStores();
    setStores(data.stores);
  }

  async function loadAlerts() {
    if (!storeId) return;
    const data = await API.getAlerts(storeId);
    setAlerts(data.alerts);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [storeId]);

  return (
    <div className={styles.alertsPage}>
      <h1>Store Alerts</h1>

      <div className={styles.alertsControls}>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores?.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {alerts.length > 0 && (
          <button
            className={styles.printButton}
            onClick={() => window.open(`/print/alerts/${storeId}`, "_blank")}
          >
            Print Alerts
          </button>
        )}
      </div>

      <div className={styles.alertsList}>
        {alerts.length === 0 && <p>No alerts for this store.</p>}

        {alerts.map((a, idx) => (
          <div
            className={`${styles.alertCard} ${styles[`severity-${a.severity}`]}`}
            key={idx}
          >
            <div className={styles.alertHeader}>
              <span className={styles.alertType}>{a.type}</span>
              <span className={styles.alertSeverity}>
                {a.severity.toUpperCase()}
              </span>
            </div>

            <div className={styles.alertBody}>
              <h3>{a.kpi || "Store Score"}</h3>
              <p>{a.message}</p>

              <p className={styles.alertAction}>
                <strong>Recommended Action:</strong> {a.recommendedAction}
              </p>

              <p className={styles.alertTime}>
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>

            <div className={styles.alertActions}>
              <button
                className={styles.actionButton}
                onClick={() => navigate(`/dashboard?store=${storeId}`)}
              >
                View Dashboard
              </button>

              <button
                className={styles.actionButton}
                onClick={() => navigate(`/reports?store=${storeId}`)}
              >
                View Reports
              </button>

              <button
                className={styles.actionButton}
                onClick={() => navigate(`/count-history?store=${storeId}`)}
              >
                Count History
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
