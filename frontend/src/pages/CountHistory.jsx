import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/CountHistory.module.css";

export default function CountHistory() {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  const [storeId, setStoreId] = useState("");
  const [itemId, setItemId] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [history, setHistory] = useState([]);

  async function loadStores() {
    const data = await API.getStores();
    setStores(data);
  }

  async function loadItems() {
    const data = await API.getItems();
    setItems(data);
  }

  async function loadHistory() {
    if (!storeId || !itemId || !startDate || !endDate) return;

    const data = await API.getCountHistory(storeId, itemId, startDate, endDate);
    setHistory(data);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
    loadItems();
  }, []);

  return (
    <div className={styles.countHistoryPage}>
      <h1>Inventory Count History</h1>

      <div className={styles.historyControls}>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Select Item</option>
          {items.map((i) => (
            <option key={i.itemId} value={i.itemId}>
              {i.name}
            </option>
          ))}
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

        <button className={styles.generateButton} onClick={loadHistory}>
          Load History
        </button>

        {history.length > 0 && (
          <button
            className={styles.printButton}
            onClick={() =>
              window.open(
                `/print/count-history/${storeId}/${itemId}?start=${startDate}&end=${endDate}`,
                "_blank",
              )
            }
          >
            Print
          </button>
        )}
      </div>

      <div className={styles.historyTableWrapper}>
        {history.length === 0 && <p>No history loaded.</p>}

        {history.length > 0 && (
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Count</th>
                <th>Notes</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {history.map((h) => (
                <tr key={h._id}>
                  <td>
                    <img src={h.itemPhotoUrl} className="history-photo" />
                    {h.itemName}
                  </td>

                  <td>
                    <img
                      src={h.categoryPhotoUrl}
                      className={styles.historyPhotoSmall}
                    />
                  </td>

                  <td>{h.quantity}</td>
                  <td>{h.notes || "—"}</td>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
