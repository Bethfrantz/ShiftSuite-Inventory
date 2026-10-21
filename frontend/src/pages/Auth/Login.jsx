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
      navigate("/inventory");
    } catch (err) {
      setError("Login error");
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Tenant Code</label>
          <input
            value={tenantCode}
            onChange={(e) => setTenantCode(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
