import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";

export default function CategoryEditModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category.name,
    description: category.description,
    photoUrl: category.photoUrl,
  });

  const [errors, setErrors] = useState({});

  // ⭐ ESC‑key close
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Category name is required.";

    if (form.photoUrl && !form.photoUrl.startsWith("http")) {
      newErrors.photoUrl = "Photo URL must be a valid link.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave(form);
    }
  }

  return createPortal(
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <h2>
            <span className={modalStyles.icon}>📁</span> Edit Category
          </h2>
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
          {errors.name && <div className={styles.errorText}>{errors.name}</div>}

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
          {errors.photoUrl && (
            <div className={styles.errorText}>{errors.photoUrl}</div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.modalSave} onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root"),
  );
}
