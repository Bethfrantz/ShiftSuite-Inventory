import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function DeleteItemModal({ item, onClose, onConfirm }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);
  return createPortal(
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <h2>
            <span className={modalStyles.icon}>🗑️</span> Delete Item
          </h2>

          <button className={modalStyles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <p>
            Are you sure you want to delete <strong>{item.name}</strong>?
          </p>

          <div className={modalStyles.warningBox}>
            <strong>Warning:</strong> This action cannot be undone.
          </div>
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
    </div>,
  );
}
