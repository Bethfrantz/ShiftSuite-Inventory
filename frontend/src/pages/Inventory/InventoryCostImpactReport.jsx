import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryCostImpactReport({ storeId, blindMode }) {
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await API.getInventoryCostForecast(storeId);
      setForecast(data);
    }
    load();
  }, [storeId]);

  const total7 = forecast.reduce((sum, f) => sum + f.forecast7Cost, 0);
  const total30 = forecast.reduce((sum, f) => sum + f.forecast30Cost, 0);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory Cost Impact Forecast</h1>

      {!blindMode && (
        <p>
          <strong>Total 7‑Day Cost Impact:</strong> ${total7.toFixed(2)} <br />
          <strong>Total 30‑Day Cost Impact:</strong> ${total30.toFixed(2)}
        </p>
      )}

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Vendor</th>

            {!blindMode && <th>Unit Cost</th>}
            {!blindMode && <th>Daily Usage (Units)</th>}
            {!blindMode && <th>7‑Day Units</th>}
            {!blindMode && <th>30‑Day Units</th>}
            {!blindMode && <th>7‑Day Cost</th>}
            {!blindMode && <th>30‑Day Cost</th>}
          </tr>
        </thead>

        <tbody>
          {forecast.map((f) => (
            <tr key={f.itemId}>
              <td>{f.name}</td>
              <td>{f.vendor}</td>

              {!blindMode && <td>${f.unitCost}</td>}
              {!blindMode && <td>{f.dailyUsage}</td>}
              {!blindMode && <td>{f.forecast7Units}</td>}
              {!blindMode && <td>{f.forecast30Units}</td>}
              {!blindMode && (
                <td style={{ color: f.forecast7Cost > 0 ? "red" : "black" }}>
                  ${f.forecast7Cost}
                </td>
              )}
              {!blindMode && (
                <td style={{ color: f.forecast30Cost > 0 ? "red" : "black" }}>
                  ${f.forecast30Cost}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printCostForecast(forecast, blindMode, total7, total30)}
      >
        Print Cost Impact Report
      </button>
    </div>
  );
}

function printCostForecast(forecast, blindMode, total7, total30) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Inventory Cost Impact Forecast</h1>");

  if (!blindMode) {
    win.document.write(`
      <p><strong>Total 7‑Day Cost Impact:</strong> $${total7.toFixed(2)}</p>
      <p><strong>Total 30‑Day Cost Impact:</strong> $${total30.toFixed(2)}</p>
    `);
  }

  forecast.forEach((f) => {
    win.document.write(`
      <div style="margin-bottom:20px;">
        <h3>${f.name}</h3>
        <p>Vendor: ${f.vendor}</p>
        ${
          !blindMode
            ? `
          <p>Unit Cost: $${f.unitCost}</p>
          <p>Daily Usage: ${f.dailyUsage} units</p>
          <p>7‑Day Units: ${f.forecast7Units}</p>
          <p>30‑Day Units: ${f.forecast30Units}</p>
          <p>7‑Day Cost Impact: $${f.forecast7Cost}</p>
          <p>30‑Day Cost Impact: $${f.forecast30Cost}</p>
        `
            : ""
        }
      </div>
    `);
  });

  win.print();
}
