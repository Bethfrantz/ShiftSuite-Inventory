import { Routes, Route } from "react-router-dom";
import ShiftSuiteNav from "./components/ShiftSuiteNav";

// Existing pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";

import ManagerDashboard from "./pages/ManagerDashboard";

import HomeDashboard from "./pages/HomeDashboard";
import "./App.css";
import Categories from "./pages/Categories";

import ItemEditModal from "./components/ItemEditModal";

function App() {
  return (
    <div className="App">
      <ShiftSuiteNav />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<HomeDashboard />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />

          <Route path="/categories" element={<Categories />} />

          <Route path="/manager" element={<ManagerDashboard />} />

          <Route path="/items/edit/:itemId" element={<ItemEditModal />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
