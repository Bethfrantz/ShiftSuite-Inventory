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

export default function VendorPriceVolatilityChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div>No price volatility data available.</div>;
  }

  return (
    <div style={{ width: "100%", height: "350px", marginTop: "2rem" }}>
      <h2>Price Volatility</h2>

      {Object.keys(data).map((itemName) => (
        <div key={itemName} style={{ marginBottom: "2rem" }}>
          <h3>{itemName}</h3>

          <ResponsiveContainer height={300}>
            <LineChart data={data[itemName]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#e67e22"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
