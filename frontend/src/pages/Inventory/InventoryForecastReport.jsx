import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryForecastReport({ storeId, blindMode }) {
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await API.getInventoryForecast(storeId);
      setForecast(data);
    }
    load();
  }, [storeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory Forecast Report</h1>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Vendor</th>
            <th>Current</th>

            {!blindMode && <th>Daily Usage</th>}
            {!blindMode && <th>Forecast (7 Days)</th>}
            {!blindMode && <th>Forecast (30 Days)</th>}
          </tr>
        </thead>

        <tbody>
          {forecast.map((f) => (
            <tr key={f.itemId}>
              <td>{f.name}</td>
              <td>{f.vendor}</td>
              <td>{f.actual}</td>

              {!blindMode && <td>{f.dailyUsage}</td>}

              {!blindMode && (
                <td style={{ color: f.forecast7 < 0 ? "red" : "black" }}>
                  {f.forecast7}
                </td>
              )}

              {!blindMode && (
                <td style={{ color: f.forecast30 < 0 ? "red" : "black" }}>
                  {f.forecast30}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printForecast(forecast, blindMode)}
      >
        Print Forecast Report
      </button>
    </div>
  );
}

function printForecast(forecast, blindMode) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Inventory Forecast Report</h1>");

  forecast.forEach((f) => {
    win.document.write(`
      <div style="margin-bottom:20px;">
        <h3>${f.name}</h3>
        <p>Vendor: ${f.vendor}</p>
        <p>Current: ${f.actual}</p>

        ${
          !blindMode
            ? `<p>Daily Usage: ${f.dailyUsage}</p>
               <p>Forecast (7 Days): ${f.forecast7}</p>
               <p>Forecast (30 Days): ${f.forecast30}</p>`
            : ""
        }

        <img src="${f.barcodeImageUrl}" />
      </div>
    `);
  });

  win.print();
}
