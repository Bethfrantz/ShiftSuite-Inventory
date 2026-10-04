import { useState } from "react";
import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";

export default function BulkImportModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").map((r) => r.split(","));
      setPreview(rows.slice(0, 5)); // show first 5 rows
    };
    reader.readAsText(selected);
  }

  function handleUpload() {
    if (!file) {
      setError("Please select a CSV file.");
      return;
    }
    onUpload(file);
  }

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalBox}>
        <div className={modalStyles.modalHeader}>
          <h2>Bulk Import Items (CSV)</h2>
          <button className={modalStyles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <label className={styles.modalLabel}>Select CSV File</label>
          <input
            className={styles.modalInput}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />

          {error && <p className={styles.errorText}>{error}</p>}

          {preview.length > 0 && (
            <div className={styles.csvPreview}>
              <h3>Preview</h3>
              <table>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((col, cidx) => (
                        <td key={cidx}>{col}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.modalSave} onClick={handleUpload}>
            Upload CSV
          </button>
        </div>
      </div>
    </div>
  );
}
