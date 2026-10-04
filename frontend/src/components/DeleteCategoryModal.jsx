import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";

export default function DeleteCategoryModal({ category, onClose, onConfirm }) {
  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalBox}>
        <div className={modalStyles.modalHeader}>
          <h2>Delete Category</h2>
          <button className={modalStyles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <p>
            Are you sure you want to delete <strong>{category.name}</strong>?
            This action cannot be undone.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalDelete} onClick={onConfirm}>
            Delete
          </button>

          <button className={styles.modalCancel} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
