import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function InventoryPurchaseOrders({ storeId, blindMode }) {
  const [orders, setOrders] = useState({});

  useEffect(() => {
    async function load() {
      const data = await API.getPurchaseOrders(storeId);
      setOrders(data);
    }
    load();
  }, [storeId]);

  // -----------------------------
  // FILE DOWNLOAD HELPER
  // -----------------------------
  async function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Vendor Purchase Orders</h1>

      {Object.keys(orders).length === 0 && <p>No purchase orders needed.</p>}

      {Object.keys(orders).map((vendor) => {
        const po = orders[vendor];

        return (
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

            {!blindMode && (
              <p>
                <strong>Total Cost:</strong> ${po.totalCost.toFixed(2)}
              </p>
            )}

            <table border="1" cellPadding="8" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Item</th>
                  {!blindMode && <th>Unit Cost</th>}
                  <th>Order Qty</th>
                  {!blindMode && <th>Line Total</th>}
                </tr>
              </thead>

              <tbody>
                {po.lineItems.map((li) => (
                  <tr key={li.itemId}>
                    <td>{li.name}</td>
                    {!blindMode && <td>${li.unitCost}</td>}
                    <td>{li.recommendedOrder}</td>
                    {!blindMode && <td>${li.lineTotal.toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* -----------------------------
          EXPORT BUTTONS
      ----------------------------- */}

      {!blindMode && (
        <>
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={async () => {
              const blob = await API.exportPOCsv(orders);
              downloadFile(blob, "purchase_orders.csv");
            }}
          >
            Export CSV
          </button>

          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={async () => {
              const blob = await API.exportPOPdf(orders);
              downloadFile(blob, "purchase_orders.pdf");
            }}
          >
            Export PDF
          </button>
        </>
      )}

      {blindMode && (
        <p style={{ marginTop: "1rem", color: "red" }}>
          Blind Mode is enabled. Cost data cannot be exported.
        </p>
      )}
    </div>
  );
}
