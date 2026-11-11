import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import ShiftSuiteNav from "./components/ShiftSuiteNav";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory/Inventory";
import ManagerDashboard from "./pages/ManagerDashboard";
import HomeDashboard from "./pages/HomeDashboard";
import Categories from "./pages/Categories";
import ItemEditModal from "./components/ItemEditModal";

import Login from "./pages/Auth/Login";
import SelectStore from "./pages/Auth/SelectStore";

import API from "./api/api";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const u = await API.getCurrentUser();

      if (!u) {
        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(u);

      // MULTI-STORE LOGIC
      if (u.storeIds.length > 1 && !u.activeStoreId) {
        setLoading(false);
        navigate("/select-store");
        return;
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <ShiftSuiteNav user={user} />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<HomeDashboard user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/categories" element={<Categories user={user} />} />
          <Route path="/manager" element={<ManagerDashboard user={user} />} />
          <Route path="/items/edit/:itemId" element={<ItemEditModal />} />

          {/* AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/select-store" element={<SelectStore user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
