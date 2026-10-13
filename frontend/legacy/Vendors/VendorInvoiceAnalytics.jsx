import React, { useEffect, useState } from "react";
import axios from "axios";

import VendorCostTrendChart from "../VendorCostTrendChart";
import VendorPriceVolatilityChart from "../VendorPriceVolatilityChart";
import VendorReliabilityScore from "../VendorReliabilityScore";
import VendorComparisonChart from "../../src/components/vendor/VendorComparisonChart";
import VendorCostSpikeChart from "../../components/vendor/VendorCostSpikeChart";

export default function VendorInvoiceAnalytics() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVendors() {
      const res = await axios.get("/api/vendors");
      setVendors(res.data.vendors || []);
    }
    loadVendors();
  }, []);

  useEffect(() => {
    if (!selectedVendor) return;
    loadVendorData(selectedVendor);
  }, [selectedVendor]);

  async function loadVendorData(vendorName) {
    setLoading(true);

    try {
      const invRes = await axios.get("/api/invoices");
      const vendorInvoices = invRes.data.invoices.filter(
        (inv) => inv.vendorName === vendorName,
      );

      setInvoices(vendorInvoices);

      const priceHistory = {};
      const costTrend = [];

      vendorInvoices.forEach((inv) => {
        const date = new Date(inv.invoiceDate).toLocaleDateString();

        let invoiceTotal = 0;

        inv.items.forEach((item) => {
          invoiceTotal += item.price * item.quantityOrdered;

          if (!priceHistory[item.name]) {
            priceHistory[item.name] = [];
          }

          priceHistory[item.name].push({
            date,
            price: item.price,
          });
        });

        costTrend.push({ date, total: invoiceTotal });
      });

      const vendorComparison = vendors.map((v) => {
        const vendorInv = invRes.data.invoices.filter(
          (inv) => inv.vendorName === v.name,
        );

        const avgCost =
          vendorInv.reduce(
            (sum, inv) =>
              sum +
              inv.items.reduce((s, i) => s + i.price * i.quantityOrdered, 0),
            0,
          ) / (vendorInv.length || 1);

        return { vendor: v.name, avgCost };
      });

      setAnalytics({
        costTrend,
        priceHistory,
        vendorComparison,
        vendorCostTrend,
        vendorForecast,
        vendorRiskScore,
        vendorContractOptimization,
      });
    } catch (err) {
      console.error("Vendor analytics error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Vendor Invoice Analytics</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>Select Vendor: </label>
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          <option value="">-- Choose Vendor --</option>
          {vendors.map((v) => (
            <option key={v._id} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading vendor analytics...</div>}

      {analytics && (
        <div>
          <VendorCostTrendChart data={analytics.costTrend} />

          <VendorCostSpikeChart data={analytics.costTrend} />

          <VendorPriceVolatilityChart data={analytics.priceHistory} />

          <VendorReliabilityScore invoices={invoices} />

          <VendorComparisonChart data={analytics.vendorComparison} />

          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h2>Vendor Risk Score</h2>

            <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {analytics.vendorRiskScore[selectedVendor]} / 100
            </p>

            <p>
              <strong>Risk Level:</strong>{" "}
              {analytics.vendorRiskScore[selectedVendor] >= 80
                ? "High Risk"
                : analytics.vendorRiskScore[selectedVendor] >= 50
                  ? "Medium Risk"
                  : "Low Risk"}
            </p>
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h2>Vendor Contract Optimization</h2>

            {analytics.vendorContractOptimization &&
              analytics.vendorContractOptimization[selectedVendor] && (
                <>
                  <p>
                    <strong>Total Spend:</strong> $
                    {analytics.vendorContractOptimization[
                      selectedVendor
                    ].totalCost.toFixed(2)}
                  </p>
                  <p>
                    <strong>Waste %:</strong>{" "}
                    {
                      analytics.vendorContractOptimization[selectedVendor]
                        .wastePct
                    }
                    %
                  </p>
                  <p>
                    <strong>Forecast 30d Change:</strong>{" "}
                    {
                      analytics.vendorContractOptimization[selectedVendor]
                        .forecastChangePct
                    }
                    %
                  </p>
                  <p>
                    <strong>Risk Score:</strong>{" "}
                    {analytics.vendorContractOptimization[selectedVendor].risk}{" "}
                    / 100
                  </p>

                  <h3>Suggested Actions</h3>
                  <ul>
                    {analytics.vendorContractOptimization[
                      selectedVendor
                    ].suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
          </div>
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => {
              const url = `/api/vendor-contract-report/${storeId}/${selectedVendor}/report`;
              window.open(url, "_blank");
            }}
          >
            Download Contract Optimization Report
          </button>

          <h2>Invoices</h2>
          <table border="1" cellPadding="8" style={{ width: "100%" }}>
            <thead>
              <tr>
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
                        <button>View</button>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
