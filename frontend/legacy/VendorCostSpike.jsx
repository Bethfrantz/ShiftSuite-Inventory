import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function VendorCostSpikeChart({ data }) {
  if (!data || data.length === 0) {
    return <div>No spike data available.</div>;
  }

  const spikeData = data.map((row, idx, arr) => {
    const prev = idx > 0 ? arr[idx - 1].total : null;
    const spike = prev && ((row.total - prev) / prev) * 100 >= 25; // 25% spike threshold

    return { ...row, spike };
  });

  return (
    <div style={{ width: "100%", height: "350px", marginTop: "2rem" }}>
      <h2>Cost Spike Detection</h2>

      <ResponsiveContainer>
        <LineChart data={spikeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#2ecc71"
            strokeWidth={3}
            dot={(props) =>
              props.payload.spike
                ? { r: 6, fill: "red" }
                : { r: 4, fill: "#2ecc71" }
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
