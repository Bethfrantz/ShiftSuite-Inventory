import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../styles/pages/ItemDetail.module.css";

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);

  async function loadItem() {
    const data = await API.getItem(itemId);
    setItem(data);
  }

  useEffect(() => {
    loadItem();
  }, [itemId]);

  if (!item) return <div>Loading...</div>;

  return (
    <div className={styles.itemDetailPage}>
      <button className={styles.backButton} onClick={() => navigate("/items")}>
        ← Back to Items
      </button>

      <div className={styles.itemDetailCard}>
        <div className={styles.itemDetailLeft}>
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className={styles.itemDetailPhoto}
            />
          ) : (
            <div className={styles.itemDetailPhoto + " " + styles.placeholder}>
              No Photo
            </div>
          )}

          {item.categoryPhotoUrl ? (
            <img
              src={item.categoryPhotoUrl}
              alt="Category"
              className={styles.itemDetailCategoryPhoto}
            />
          ) : (
            <div
              className={
                styles.itemDetailCategoryPhoto + " " + styles.placeholder
              }
            >
              No Category Photo
            </div>
          )}
        </div>

        <div className={styles.itemDetailRight}>
          <h1>{item.name}</h1>
          <p>
            <strong>Vendor:</strong> {item.vendor}
          </p>
          <p>
            <strong>Barcode:</strong> {item.barcode || "None"}
          </p>
          <p>
            <strong>Units:</strong> {item.units}
          </p>
          <p>
            <strong>Par:</strong> {item.par}
          </p>
          <p>
            <strong>Description:</strong> {item.description || "No description"}
          </p>

          <div className={styles.itemDetailActions}>
            <button
              className={styles.editButton}
              onClick={() => navigate(`/items/edit/${item.itemId}`)}
            >
              Edit Item
            </button>

            <button
              className={styles.deleteButton}
              onClick={() => navigate(`/items/delete/${item.itemId}`)}
            >
              Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
