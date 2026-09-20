import { Link } from "react-router-dom";
import styles from "../styles/components/ItemCard.module.css";

export default function ItemCard({ item }) {
  return (
    <div className={styles.card}>
      {/* Photo */}
      <div className={styles.photoWrapper}>
        {item.photo ? (
          <img src={item.photo} alt={item.name} className={styles.photo} />
        ) : (
          <div className={styles.placeholder}>No Photo</div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{item.name}</h3>

        <p className={styles.detail}>SKU: {item.sku}</p>
        <p className={styles.detail}>Qty: {item.quantity}</p>

        {/* Category */}
        <div className={styles.categoryRow}>
          {item.categoryPhoto ? (
            <img
              src={item.categoryPhoto}
              alt={item.category}
              className={styles.categoryPhoto}
            />
          ) : (
            <div className={styles.categoryPlaceholder}>Category</div>
          )}
          <span className={styles.categoryName}>{item.category}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link to={`/items/${item._id}`} className={styles.viewButton}>
            View
          </Link>

          <button
            className={styles.editButton}
            onClick={() => item.onEdit(item)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
