import styles from "../styles/modals/CategoryModal.module.css";

export default function DeleteCategoryModal({ category, onClose, onConfirm }) {
  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-box"] + " " + styles["delete-box"]}>
        <h2>Delete Category</h2>

        <p>
          Are you sure you want to delete <strong>{category.name}</strong>? This
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
