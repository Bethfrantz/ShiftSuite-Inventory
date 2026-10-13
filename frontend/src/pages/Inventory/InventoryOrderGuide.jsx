import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryOrderGuide({ storeId, blindMode }) {
  const [forecast, setForecast] = useState([]);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    async function load() {
      const data = await API.getVendorDeliveryForecast(storeId);

      // Group by vendor
      const vendors = {};
      data.forEach((item) => {
        if (!vendors[item.vendor]) vendors[item.vendor] = [];
        vendors[item.vendor].push(item);
      });

      setForecast(data);
      setGrouped(vendors);
    }
    load();
  }, [storeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Order Guide</h1>

      {Object.keys(grouped).map((vendor) => (
        <div
          key={vendor}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "2rem",
            borderRadius: "8px",
          }}
        >
          <h2>{vendor}</h2>

          <table border="1" cellPadding="8" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Item</th>
                {!blindMode && <th>Daily Usage</th>}
                {!blindMode && <th>Required Units</th>}
                {!blindMode && <th>Current On Hand</th>}
                <th>Recommended Order</th>
              </tr>
            </thead>

            <tbody>
              {grouped[vendor].map((item) => (
                <tr key={item.itemId}>
                  <td>{item.name}</td>

                  {!blindMode && <td>{item.dailyUsage}</td>}
                  {!blindMode && <td>{item.requiredUnits}</td>}
                  {!blindMode && <td>{item.currentOnHand}</td>}

                  <td
                    style={{
                      color: item.recommendedOrder > 0 ? "blue" : "black",
                      fontWeight: "bold",
                    }}
                  >
                    {item.recommendedOrder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printOrderGuide(grouped, blindMode)}
      >
        Print Order Guide
      </button>
    </div>
  );
}

function printOrderGuide(grouped, blindMode) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Order Guide</h1>");

  Object.keys(grouped).forEach((vendor) => {
    win.document.write(`<h2>${vendor}</h2>`);

    grouped[vendor].forEach((item) => {
      win.document.write(`
        <div style="margin-bottom:20px;">
          <h3>${item.name}</h3>

          ${
            !blindMode
              ? `
            <p>Daily Usage: ${item.dailyUsage}</p>
            <p>Required Units: ${item.requiredUnits}</p>
            <p>Current On Hand: ${item.currentOnHand}</p>
          `
              : ""
          }

          <p><strong>Recommended Order:</strong> ${item.recommendedOrder}</p>
        </div>
      `);
    });
  });

  win.print();
}
