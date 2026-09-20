import styles from "../styles/modals/DeleteItemModal.module.css";

export default function DeleteItemModal({ item, onClose, onConfirm }) {
  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-box"] + " " + styles["delete-box"]}>
        <h2>Delete Item</h2>

        <p>
          Are you sure you want to delete <strong>{item.name}</strong>? This
          action cannot be undone.
        </p>

        <div className={styles["modal-actions"]}>
          <button className={styles["modal-delete"]} onClick={onConfirm}>
            Delete
          </button>

          <button className={styles["modal-cancel"]} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
