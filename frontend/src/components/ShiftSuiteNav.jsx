import { Link } from "react-router-dom";
import styles from "../styles/components/ShiftSuiteNav.module.css";

export default function ShiftSuiteNav() {
  return (
    <div className={styles.topnavWrapper}>
      <div className={styles.topnavMain}>
        <div className={styles.topnavLogo}>ShiftSuite</div>

        <nav className={styles.topnavLinks}>
          <Link to="/" className={styles.topnavLink}>
            Home
          </Link>
          <Link to="/items" className={styles.topnavLink}>
            Items
          </Link>
          <Link to="/inventory" className={styles.topnavLink}>
            Inventory
          </Link>
          <Link to="/manager" className={styles.topnavLink}>
            Manager
          </Link>
          <Link to="/reports" className={styles.topnavLink}>
            Reports
          </Link>
          <Link to="/alerts" className={styles.topnavLink}>
            Alerts
          </Link>
          <Link to="/waste" className={styles.topnavLink}>
            Waste
          </Link>
        </nav>
      </div>
    </div>
  );
}
