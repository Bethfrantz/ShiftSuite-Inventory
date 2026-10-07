import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function VendorComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return <div>No vendor comparison data available.</div>;
  }

  return (
    <div style={{ width: "100%", height: "350px", marginTop: "2rem" }}>
      <h2>Vendor Comparison</h2>

      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="vendor" />
          <YAxis tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Bar dataKey="avgCost" fill="#3498db" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
