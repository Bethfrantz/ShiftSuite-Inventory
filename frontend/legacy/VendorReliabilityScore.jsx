import React from "react";

export default function VendorReliabilityScore({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return <div>No reliability data available.</div>;
  }

  const priceChanges = invoices.flatMap((inv) => inv.items.map((i) => i.price));

  const volatility =
    priceChanges.length > 1
      ? Math.abs(
          ((priceChanges[priceChanges.length - 1] - priceChanges[0]) /
            priceChanges[0]) *
            100,
        )
      : 0;

  const reliabilityScore = Math.max(0, 100 - volatility);

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        marginTop: "2rem",
      }}
    >
      <h2>Vendor Reliability Score</h2>
      <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
        {reliabilityScore.toFixed(1)} / 100
      </p>
      <p>Lower volatility = higher reliability.</p>
    </div>
  );
}
