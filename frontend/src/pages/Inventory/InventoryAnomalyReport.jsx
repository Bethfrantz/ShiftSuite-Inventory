import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryAnomalyReport({ storeId, blindMode, user }) {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await API.getInventoryAnomalies(storeId);
      setAnomalies(data);
    }
    load();
  }, [storeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory Anomaly Report</h1>

      {anomalies.length === 0 && <p>No anomalies detected.</p>}

      {anomalies.map((a) => (
        <div
          key={a.itemId}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "8px",
          }}
        >
          <h2>{a.name}</h2>
          <p>
            <strong>Vendor:</strong> {a.vendor}
          </p>

          <ul>
            {a.anomalies.map((an, idx) => (
              <li key={idx}>
                <strong>{an.type}</strong>

                {/* Hide detailed anomaly explanation in blind mode */}
                {!blindMode ? <> — {an.detail}</> : <> — Details Hidden</>}

                <span
                  style={{
                    color: an.severity === "high" ? "red" : "orange",
                    marginLeft: "0.5rem",
                  }}
                >
                  ({an.severity})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printAnomalies(anomalies, blindMode)}
      >
        Print Anomaly Report
      </button>
    </div>
  );
}

function printAnomalies(anomalies, blindMode) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Inventory Anomaly Report</h1>");

  anomalies.forEach((a) => {
    win.document.write(`
      <div style="margin-bottom:20px;">
        <h3>${a.name}</h3>
        <p>Vendor: ${a.vendor}</p>
        <ul>
          ${a.anomalies
            .map(
              (an) =>
                `<li>
                  <strong>${an.type}</strong> — ${
                    blindMode ? "Details Hidden" : an.detail
                  } (${an.severity})
                </li>`,
            )
            .join("")}
        </ul>
      </div>
    `);
  });

  win.print();
}
