import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadInvoice() {
    try {
      const res = await axios.get(`/api/invoices/${id}`);
      setInvoice(res.data.invoice);
    } catch (err) {
      console.error("Failed to load invoice:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function handleReceive() {
    await axios.post(`/api/invoices/${id}/receive`);
    alert("Inventory updated from invoice.");
    loadInvoice();
  }

  async function handleUpdatePrices() {
    await axios.post(`/api/invoices/${id}/update-prices`);
    alert("Item prices updated from invoice.");
    loadInvoice();
  }

  if (loading) return <div>Loading invoice...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  const totalCost = invoice.items.reduce(
    (sum, i) => sum + i.price * i.quantityOrdered,
    0,
  );

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Invoice Detail</h1>

      <div style={{ marginBottom: "1rem" }}>
        <a href="/invoices">
          <button>Back to Invoices</button>
        </a>
      </div>

      <div
        style={{
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2>{invoice.vendorName || "Unknown Vendor"}</h2>

        <p>
          <strong>Invoice #:</strong> {invoice.invoiceNumber || "N/A"}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString()
            : "N/A"}
        </p>
        <p>
          <strong>Store:</strong> {invoice.storeId}
        </p>

        <p>
          <strong>Total Cost:</strong>{" "}
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            ${totalCost.toFixed(2)}
          </span>
        </p>
      </div>

      <h3>Line Items</h3>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty Ordered</th>
            <th>Price</th>
            <th>Line Total</th>
          </tr>
        </thead>

        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.itemId?.name || item.name || "Unknown Item"}</td>
              <td>{item.quantityOrdered}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>${(item.price * item.quantityOrdered).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={handleReceive}
          style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
        >
          Receive Invoice
        </button>

        <button onClick={handleUpdatePrices} style={{ padding: "0.5rem 1rem" }}>
          Update Prices
        </button>
      </div>

      {/* Raw OCR text (optional) */}
      {invoice.rawText && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Raw OCR Text</h3>
          <pre
            style={{
              background: "#f7f7f7",
              padding: "1rem",
              borderRadius: "6px",
              whiteSpace: "pre-wrap",
            }}
          >
            {invoice.rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
