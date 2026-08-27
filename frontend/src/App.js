import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Items from "./pages/Items";

function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/items" element={<Items />} />
          <Route path="/items/:itemId" element={<ItemDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/count-history" element={<CountHistory />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/waste" element={<WasteTracking />} />
          <Route path="/district-comparison" element={<DistrictComparison />} />
          <Route path="/alerts" element={<StoreAlerts />} />
          <Route path="/waste-cost" element={<WasteCost />} />
          <Route path="/" element={<HomeDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
