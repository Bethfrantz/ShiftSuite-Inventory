import { useEffect, useState } from "react";
import API from "../api/api";
import "./StoreAlerts.css";
import { useNavigate } from "react-router-dom";

export default function StoreAlerts() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [alerts, setAlerts] = useState([]);

  const navigate = useNavigate();

  async function loadStores() {
    const data = await API.getStores();
    setStores(data);
  }

  async function loadAlerts() {
    if (!storeId) return;
    const data = await API.getAlerts(storeId);
    setAlerts(data.alerts);
  }

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [storeId]);

  return (
    <div className="alerts-page">
      <h1>Store Alerts</h1>

      <div className="alerts-controls">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {alerts.length > 0 && (
          <button
            className="print-button"
            onClick={() => window.open(`/print/alerts/${storeId}`, "_blank")}
          >
            Print Alerts
          </button>
        )}
      </div>

      <div className="alerts-list">
        {alerts.length === 0 && <p>No alerts for this store.</p>}

        {alerts.map((a, idx) => (
          <div className={`alert-card severity-${a.severity}`} key={idx}>
            <div className="alert-header">
              <span className="alert-type">{a.type}</span>
              <span className="alert-severity">{a.severity.toUpperCase()}</span>
            </div>

            <div className="alert-body">
              <h3>{a.kpi || "Store Score"}</h3>
              <p>{a.message}</p>

              <p className="alert-action">
                <strong>Recommended Action:</strong> {a.recommendedAction}
              </p>

              <p className="alert-time">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="alert-actions">
              <button
                className="action-button"
                onClick={() => navigate(`/dashboard?store=${storeId}`)}
              >
                View Dashboard
              </button>

              <button
                className="action-button"
                onClick={() => navigate(`/reports?store=${storeId}`)}
              >
                View Reports
              </button>

              <button
                className="action-button"
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
