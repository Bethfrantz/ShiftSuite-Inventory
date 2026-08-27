import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">ShiftSuite</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link">
          <span className="sidebar-icon">🏠</span>
          <span className="sidebar-text">Dashboard</span>
        </NavLink>

        <NavLink to="/inventory" className="sidebar-link">
          <span className="sidebar-icon">📦</span>
          <span className="sidebar-text">Inventory</span>
        </NavLink>

        <NavLink to="/items" className="sidebar-link">
          <span className="sidebar-icon">📝</span>
          <span className="sidebar-text">Items</span>
        </NavLink>

        <NavLink to="/reports" className="sidebar-link">
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-text">Reports</span>
        </NavLink>

        <NavLink to="/invoices" className="sidebar-link">
          <span className="sidebar-icon">🧾</span>
          <span className="sidebar-text">Invoices</span>
        </NavLink>

        <NavLink to="/adjustments" className="sidebar-link">
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-text">Adjustments</span>
        </NavLink>
      </nav>
    </aside>
  );
}
