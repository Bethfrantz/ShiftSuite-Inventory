import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryVendorForecastReport({ storeId, blindMode }) {
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await API.getVendorDeliveryForecast(storeId);
      setForecast(data);
    }
    load();
  }, [storeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Vendor Delivery Forecast</h1>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Vendor</th>
            {!blindMode && <th>Daily Usage</th>}
            {!blindMode && <th>Lead Time (Days)</th>}
            {!blindMode && <th>Safety Stock (Days)</th>}
            {!blindMode && <th>Required Units</th>}
            {!blindMode && <th>Current On Hand</th>}
            {!blindMode && <th>Recommended Order</th>}
          </tr>
        </thead>

        <tbody>
          {forecast.map((f) => (
            <tr key={f.itemId}>
              <td>{f.name}</td>
              <td>{f.vendor}</td>

              {!blindMode && <td>{f.dailyUsage}</td>}
              {!blindMode && <td>{f.deliveryLeadDays}</td>}
              {!blindMode && <td>{f.safetyStockDays}</td>}
              {!blindMode && <td>{f.requiredUnits}</td>}
              {!blindMode && <td>{f.currentOnHand}</td>}
              {!blindMode && (
                <td
                  style={{ color: f.recommendedOrder > 0 ? "blue" : "black" }}
                >
                  {f.recommendedOrder}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printVendorForecast(forecast, blindMode)}
      >
        Print Vendor Delivery Forecast
      </button>
    </div>
  );
}

function printVendorForecast(forecast, blindMode) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Vendor Delivery Forecast</h1>");

  forecast.forEach((f) => {
    win.document.write(`
      <div style="margin-bottom:20px;">
        <h3>${f.name}</h3>
        <p>Vendor: ${f.vendor}</p>
        ${
          !blindMode
            ? `
          <p>Daily Usage: ${f.dailyUsage}</p>
          <p>Lead Time: ${f.deliveryLeadDays} days</p>
          <p>Safety Stock: ${f.safetyStockDays} days</p>
          <p>Required Units Before Next Truck: ${f.requiredUnits}</p>
          <p>Current On Hand: ${f.currentOnHand}</p>
          <p>Recommended Order: ${f.recommendedOrder}</p>
        `
            : ""
        }
      </div>
    `);
  });

  win.print();
}
