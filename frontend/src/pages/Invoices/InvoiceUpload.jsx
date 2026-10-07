import React, { useState } from "react";
import axios from "axios";

export default function InvoiceUpload() {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function handleScan() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("/api/invoices/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setParsed(res.data.parsed);
  }

  async function handleSaveInvoice() {
    if (!parsed) return;

    setSaving(true);

    const res = await axios.post("/api/invoices", {
      vendorName: parsed.vendor,
      invoiceNumber: parsed.invoiceNumber,
      invoiceDate: parsed.invoiceDate,
      storeId: "YOUR_STORE_ID", // replace with actual store selector
      items: parsed.items.map((i) => ({
        name: i.name,
        quantityOrdered: i.quantityOrdered,
        price: i.price,
      })),
      rawText: parsed.rawText,
    });

    setSavedInvoice(res.data.invoice);
    setSaving(false);
  }

  async function handleUpdatePrices() {
    if (!savedInvoice) return;

    await axios.post(`/api/invoices/${savedInvoice._id}/update-prices`);
    alert("Prices updated from invoice!");
  }

  async function handleReceiveInvoice() {
    if (!savedInvoice) return;

    await axios.post(`/api/invoices/${savedInvoice._id}/receive`);
    alert("Inventory updated from invoice!");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload Invoice</h1>

      {/* Upload */}
      <div
        style={{
          border: "2px dashed #999",
          padding: "2rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleScan} disabled={!file}>
          Scan Invoice
        </button>
      </div>

      {/* Parsed Preview */}
      {parsed && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Parsed Invoice Preview</h2>

          <p>
            <strong>Vendor:</strong> {parsed.vendor}
          </p>
          <p>
            <strong>Invoice #:</strong> {parsed.invoiceNumber}
          </p>
          <p>
            <strong>Date:</strong> {parsed.invoiceDate}
          </p>

          <h3>Items</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {parsed.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantityOrdered}</td>
                  <td>${item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSaveInvoice}
            disabled={saving}
            style={{ marginTop: "1rem" }}
          >
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      )}

      {/* Saved Invoice Actions */}
      {savedInvoice && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Invoice Saved</h2>
          <p>ID: {savedInvoice._id}</p>

          <button onClick={handleUpdatePrices} style={{ marginRight: "1rem" }}>
            Update Item Prices
          </button>

          <button onClick={handleReceiveInvoice}>Receive Inventory</button>
        </div>
      )}
    </div>
  );
}
