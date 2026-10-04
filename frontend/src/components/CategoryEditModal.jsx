import { useState } from "react";
import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";

export default function CategoryEditModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category.name,
    description: category.description,
    photoUrl: category.photoUrl,
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalBox}>
        <div className={modalStyles.modalHeader}>
          <h2>Edit Category</h2>
          <button className={modalStyles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <label className={styles.modalLabel}>Name</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />

          <label className={styles.modalLabel}>Description</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <label className={styles.modalLabel}>Photo URL</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.photoUrl}
            onChange={(e) => updateField("photoUrl", e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.modalSave} onClick={() => onSave(form)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
