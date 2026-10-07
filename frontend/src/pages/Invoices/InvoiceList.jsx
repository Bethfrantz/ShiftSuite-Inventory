import React, { useEffect, useState } from "react";
import axios from "axios";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadInvoices() {
    try {
      const res = await axios.get("/api/invoices");
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleReceive(id) {
    await axios.post(`/api/invoices/${id}/receive`);
    alert("Inventory updated from invoice.");
  }

  async function handleUpdatePrices(id) {
    await axios.post(`/api/invoices/${id}/update-prices`);
    alert("Item prices updated from invoice.");
  }

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Invoices</h1>

      <div style={{ marginBottom: "1rem" }}>
        <a href="/invoices/upload">
          <button>Upload New Invoice</button>
        </a>
      </div>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Total Cost</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => {
            const totalCost = inv.items.reduce(
              (sum, i) => sum + i.price * i.quantityOrdered,
              0,
            );

            return (
              <tr key={inv._id}>
                <td>{inv.vendorName || "Unknown Vendor"}</td>
                <td>{inv.invoiceNumber || "N/A"}</td>
                <td>
                  {inv.invoiceDate
                    ? new Date(inv.invoiceDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>${totalCost.toFixed(2)}</td>
                <td>{inv.items.length}</td>

                <td>
                  <a href={`/invoices/${inv._id}`}>
                    <button style={{ marginRight: "0.5rem" }}>View</button>
                  </a>

                  <button
                    onClick={() => handleReceive(inv._id)}
                    style={{ marginRight: "0.5rem" }}
                  >
                    Receive
                  </button>

                  <button onClick={() => handleUpdatePrices(inv._id)}>
                    Update Prices
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
