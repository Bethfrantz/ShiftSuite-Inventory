import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/WasteTracking.module.css";

export default function WasteTracking() {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);

  const [storeId, setStoreId] = useState("");
  const [type, setType] = useState("raw"); // raw | finished
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const [history, setHistory] = useState([]);

  async function loadStores() {
    setStores(await API.getStores());
  }

  async function loadItems() {
    setItems(await API.getItems());
  }

  async function loadFinishedProducts() {
    setFinishedProducts(await API.getFinishedProducts());
  }

  async function loadHistory() {
    if (!storeId) return;
    setHistory(await API.getWasteHistory(storeId));
  }

  async function submitWaste() {
    const payload = {
      storeId,
      type,
      rawItemId: type === "raw" ? selectedId : null,
      finishedProductId: type === "finished" ? selectedId : null,
      quantity,
      reason,
    };

    await API.submitWaste(payload);
    loadHistory();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
    loadItems();
    loadFinishedProducts();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [storeId]);

  return (
    <div className={styles.wastePage}>
      <h1>Waste Tracking</h1>

      <div className={styles.wasteControls}>
        {/* Store Selector */}
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Waste Type */}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="raw">Raw Item</option>
          <option value="finished">Finished Product</option>
        </select>

        {/* Item Selector */}
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select Item</option>

          {type === "raw" &&
            items.map((i) => (
              <option key={i.itemId} value={i.itemId}>
                {i.name}
              </option>
            ))}

          {type === "finished" &&
            finishedProducts.map((fp) => (
              <option key={fp._id} value={fp._id}>
                {fp.name}
              </option>
            ))}
        </select>

        {/* Quantity */}
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
        />

        {/* Reason */}
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Reason</option>
          <option value="expired">Expired</option>
          <option value="incorrect prep">Incorrect Prep</option>
          <option value="damaged">Damaged</option>
          <option value="spoiled">Spoiled</option>
          <option value="other">Other</option>
        </select>

        <button className={styles.submitButton} onClick={submitWaste}>
          Submit Waste
        </button>

        {history.length > 0 && (
          <button
            className={styles.printButton}
            onClick={() => window.open(`/print/waste/${storeId}`, "_blank")}
          >
            Print Waste Report
          </button>
        )}
      </div>

      <div className={styles.wasteHistory}>
        <h2>Waste History</h2>

        {history.length === 0 && <p>No waste recorded.</p>}

        {history.length > 0 && (
          <table className={styles.wasteTable}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {history.map((w) => (
                <tr key={w._id}>
                  <td>{w.type}</td>
                  <td>{w.name}</td>
                  <td>{w.quantity}</td>
                  <td>{w.reason}</td>
                  <td>{new Date(w.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
