import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("ELMOS");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await API.login(email, password, tenantCode);

      if (!data.token) {
        setError("Invalid credentials");
        return;
      }

      if (data.user.storeIds.length > 1) {
        navigate("/select-store");
      } else {
        navigate("/inventory");
      }
    } catch {
      setError("Login failed");
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Tenant Code</label>
        <input
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
