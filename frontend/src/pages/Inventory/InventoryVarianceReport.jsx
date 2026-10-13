import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryVarianceReport({ storeId, blindMode, user }) {
  const [variance, setVariance] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await API.getInventoryVariance(storeId);
      setVariance(data);
    }
    load();
  }, [storeId]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory Variance Report</h1>

      {variance.length === 0 && <p>No variance data available.</p>}

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th>Item</th>
            <th>Vendor</th>

            {/* Hide PAR + Last Count in Blind Mode */}
            {!blindMode && (
              <>
                <th>PAR</th>
                <th>Last Count</th>
              </>
            )}

            <th>Actual</th>

            {/* Hide variance in Blind Mode */}
            {!blindMode && (
              <>
                <th>Variance vs PAR</th>
                <th>Variance vs Last</th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {variance.map((v) => (
            <tr key={v.itemId}>
              <td>{v.name}</td>
              <td>{v.vendor}</td>

              {!blindMode && (
                <>
                  <td>{v.par}</td>
                  <td>{v.last}</td>
                </>
              )}

              <td>{v.actual}</td>

              {!blindMode && (
                <>
                  <td
                    style={{
                      color:
                        v.parVariance < 0
                          ? "red"
                          : v.parVariance > 0
                            ? "green"
                            : "black",
                    }}
                  >
                    {v.parVariance}
                  </td>

                  <td
                    style={{
                      color:
                        v.lastVariance < 0
                          ? "red"
                          : v.lastVariance > 0
                            ? "green"
                            : "black",
                    }}
                  >
                    {v.lastVariance}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* PRINT BUTTON */}
      <button
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
        onClick={() => printVariance(variance, blindMode)}
      >
        Print Variance Report
      </button>
    </div>
  );
}

function printVariance(variance, blindMode) {
  const win = window.open("", "_blank");

  win.document.write("<h1>Inventory Variance Report</h1>");

  variance.forEach((v) => {
    win.document.write(`
      <div style="margin-bottom:20px;">
        <h3>${v.name}</h3>
        <p>Vendor: ${v.vendor}</p>

        ${!blindMode ? `<p>PAR: ${v.par}</p>` : ""}
        ${!blindMode ? `<p>Last Count: ${v.last}</p>` : ""}

        <p>Actual: ${v.actual}</p>

        ${
          !blindMode
            ? `<p>Variance vs PAR: ${v.parVariance}</p>
               <p>Variance vs Last: ${v.lastVariance}</p>`
            : ""
        }

        <img src="${v.barcodeImageUrl}" />
      </div>
    `);
  });

  win.print();
}
