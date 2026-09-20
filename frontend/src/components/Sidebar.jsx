import { NavLink } from "react-router-dom";
import styles from "../styles/components/Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles["sidebar"]}>
      <div className={styles["sidebar-header"]}>
        <h2 className={styles["sidebar-title"]}>ShiftSuite</h2>
      </div>

      <nav className={styles["sidebar-nav"]}>
        <NavLink to="/" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>🏠</span>
          <span className={styles["sidebar-text"]}>Dashboard</span>
        </NavLink>

        <NavLink to="/inventory" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>📦</span>
          <span className={styles["sidebar-text"]}>Inventory</span>
        </NavLink>

        <NavLink to="/items" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>📝</span>
          <span className={styles["sidebar-text"]}>Items</span>
        </NavLink>

        <NavLink to="/reports" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>📊</span>
          <span className={styles["sidebar-text"]}>Reports</span>
        </NavLink>

        <NavLink to="/invoices" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>🧾</span>
          <span className={styles["sidebar-text"]}>Invoices</span>
        </NavLink>

        <NavLink to="/adjustments" className={styles["sidebar-link"]}>
          <span className={styles["sidebar-icon"]}>⚙️</span>
          <span className={styles["sidebar-text"]}>Adjustments</span>
        </NavLink>
      </nav>
    </aside>
  );
}
