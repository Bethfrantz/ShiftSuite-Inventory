import { useState } from "react";
import styles from "../styles/modals/BulkImportModal.module.css";

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
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Bulk Import Items (CSV)</h2>

        <input type="file" accept=".csv" onChange={handleFileChange} />

        {error && <p className="error-text">{error}</p>}

        {preview.length > 0 && (
          <div className="csv-preview">
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

        <div className="modal-actions">
          <button className="modal-save" onClick={handleUpload}>
            Upload CSV
          </button>
          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
