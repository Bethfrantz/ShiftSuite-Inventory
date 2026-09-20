import { useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/Reports.module.css";

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);

  async function generateReport() {
    if (!reportType || !startDate || !endDate) return;

    const data = await API.getReport(reportType, startDate, endDate);
    setReportData(data);
  }

  return (
    <div className={styles.reportsPage}>
      <h1>Reports</h1>

      <div className={styles.reportsControls}>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="">Select Report</option>
          <option value="inventory-value">Inventory Value</option>
          <option value="waste">Waste Report</option>
          <option value="category-usage">Category Usage</option>
          <option value="vendor-spend">Vendor Spend</option>
          <option value="count-history">Count History</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className={styles.generateButton} onClick={generateReport}>
          Generate
        </button>

        {reportData && (
          <button
            className={styles.printButton}
            onClick={() =>
              window.open(
                `/print/report/${reportType}?start=${startDate}&end=${endDate}`,
                "_blank",
              )
            }
          >
            Print Report
          </button>
        )}
      </div>

      <div className={styles.reportViewer}>
        {!reportData && <p>Select a report and date range.</p>}

        {reportData && (
          <div className={styles.reportCard}>
            <h2>{reportData.title}</h2>

            {reportData.table && (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    {reportData.table.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.table.rows.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cidx) => (
                        <td key={cidx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportData.summary && (
              <div className={styles.reportSummary}>
                <h3>Summary</h3>
                <p>{reportData.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
