import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function SelectStore({ user }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleSelect(storeId) {
    try {
      await API.selectStore(storeId);
      navigate("/inventory");
    } catch (err) {
      setError("Error selecting store");
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Select Store</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {user.storeIds.map((store) => (
        <button
          key={store._id}
          style={{ display: "block", marginBottom: "1rem" }}
          onClick={() => handleSelect(store._id)}
        >
          {store.name}
        </button>
      ))}
    </div>
  );
}
