import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/WasteCost.module.css";

export default function WasteCost() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [data, setData] = useState(null);
  const [selectedFinished, setSelectedFinished] = useState(null);

  async function loadStores() {
    setStores(await API.getStores());
  }

  async function loadWasteCost() {
    if (!storeId) return;

    const res = await API.getWasteCost(storeId, startDate, endDate);
    setData(res);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStores();
  }, []);

  return (
    <div className={styles.wasteCostPage}>
      <h1>Waste Cost Analysis</h1>

      <div className={styles.controls}>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
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

        <button className={styles.loadButton} onClick={loadWasteCost}>
          Load Cost
        </button>

        {data && (
          <button
            className={styles.printButton}
            onClick={() =>
              window.open(
                `/print/waste-cost/${storeId}?start=${startDate}&end=${endDate}`,
                "_blank",
              )
            }
          >
            Print Report
          </button>
        )}
      </div>

      {!data && <p>Select store and date range.</p>}

      {data && (
        <>
          {/* Summary */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <h3>Total Waste Cost</h3>
              <p className={styles.summaryValue}>
                ${data.totalCost.toFixed(2)}
              </p>
            </div>

            <div className={styles.summaryCard}>
              <h3>Raw Waste Items</h3>
              <p className={styles.summaryValue}>{data.rawWasteCost.length}</p>
            </div>

            <div className={styles.summaryCard}>
              <h3>Finished Product Waste</h3>
              <p className={styles.summaryValue}>
                {data.finishedWasteCost.length}
              </p>
            </div>
          </div>

          {/* Raw Waste Table */}
          <h2>Raw Waste Cost</h2>
          <table className={styles.wasteTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Cost</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.rawWasteCost.map((w) => (
                <tr key={w.itemId}>
                  <td>{w.name}</td>
                  <td>{w.quantity}</td>
                  <td>${w.unitPrice.toFixed(2)}</td>
                  <td>${w.cost.toFixed(2)}</td>
                  <td>{w.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Finished Product Waste */}
          <h2>Finished Product Waste Cost</h2>
          <table className={styles.wasteTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Total Cost</th>
                <th>Reason</th>
                <th>Ingredients</th>
              </tr>
            </thead>
            <tbody>
              {data.finishedWasteCost.map((fp) => (
                <tr key={fp.finishedProductId}>
                  <td>{fp.name}</td>
                  <td>{fp.quantity}</td>
                  <td>${fp.totalCost.toFixed(2)}</td>
                  <td>{fp.reason}</td>
                  <td>
                    <button
                      className={styles.ingredientButton}
                      onClick={() => setSelectedFinished(fp)}
                    >
                      View Ingredients
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ingredient Breakdown Modal */}
          {selectedFinished && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalBox}>
                <h3>{selectedFinished.name} — Ingredient Cost Breakdown</h3>

                <table className={styles.ingredientTable}>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Qty Used</th>
                      <th>Unit Price</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFinished.ingredients.map((ing) => (
                      <tr key={ing.itemId}>
                        <td>{ing.name}</td>
                        <td>{ing.quantityUsed}</td>
                        <td>${ing.unitPrice.toFixed(2)}</td>
                        <td>${ing.cost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  className={styles.closeButton}
                  onClick={() => setSelectedFinished(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
