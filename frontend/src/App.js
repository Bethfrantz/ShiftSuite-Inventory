import { Routes, Route } from "react-router-dom";
import ShiftSuiteNav from "./components/ShiftSuiteNav";

// Existing pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Items from "./pages/Items";

import ItemDetail from "./pages/ItemDetail";
import Reports from "./pages/Reports";
import CountHistory from "./pages/CountHistory";
import ManagerDashboard from "./pages/ManagerDashboard";
import WasteTracking from "./pages/WasteTracking";
import DistrictComparison from "./pages/DistrictComparison";
import StoreAlerts from "./pages/StoreAlerts";
import WasteCost from "./pages/WasteCost";
import HomeDashboard from "./pages/HomeDashboard";
import "./App.css";

function App() {
  return (
    <div className="App">
      <ShiftSuiteNav />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<HomeDashboard />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/items" element={<Items />} />
          <Route path="/items/:itemId" element={<ItemDetail />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/count-history" element={<CountHistory />} />

          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/waste" element={<WasteTracking />} />
          <Route path="/district-comparison" element={<DistrictComparison />} />
          <Route path="/alerts" element={<StoreAlerts />} />
          <Route path="/waste-cost" element={<WasteCost />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
