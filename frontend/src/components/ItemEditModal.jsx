import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import modalStyles from "../styles/modals/Modal.module.css";
import styles from "../styles/modals/CategoryModal.module.css";

export default function ItemEditModal({ item, onClose, onSave }) {
  // ⭐ SAFE INITIAL STATE — works even if item is undefined
  const [form, setForm] = useState(() => ({
    name: item?.name ?? "",
    vendor: item?.vendor ?? "",
    barcode: item?.barcode ?? "",
    units: item?.units ?? "",
    par: item?.par ?? "",
    photoUrl: item?.photoUrl ?? "",
    categoryPhotoUrl: item?.categoryPhotoUrl ?? "",
  }));

  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.vendor.trim()) newErrors.vendor = "Vendor is required.";

    if (form.par !== "" && isNaN(Number(form.par))) {
      newErrors.par = "Par must be a number.";
    }

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
            <span className={modalStyles.icon}>✏️</span> Edit Item
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

          <label className={styles.modalLabel}>Vendor</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.vendor}
            onChange={(e) => updateField("vendor", e.target.value)}
          />
          {errors.vendor && (
            <div className={styles.errorText}>{errors.vendor}</div>
          )}

          <label className={styles.modalLabel}>Barcode</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.barcode}
            onChange={(e) => updateField("barcode", e.target.value)}
          />
          {errors.barcode && (
            <div className={styles.errorText}>{errors.barcode}</div>
          )}

          <label className={styles.modalLabel}>Units</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.units}
            onChange={(e) => updateField("units", e.target.value)}
          />
          {errors.units && (
            <div className={styles.errorText}>{errors.units}</div>
          )}

          <label className={styles.modalLabel}>Par</label>
          <input
            className={styles.modalInput}
            type="number"
            value={form.par}
            onChange={(e) => updateField("par", e.target.value)}
          />
          {errors.par && <div className={styles.errorText}>{errors.par}</div>}

          <label className={styles.modalLabel}>Item Photo URL</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.photoUrl}
            onChange={(e) => updateField("photoUrl", e.target.value)}
          />
          {errors.photoUrl && (
            <div className={styles.errorText}>{errors.photoUrl}</div>
          )}

          <label className={styles.modalLabel}>Category Photo URL</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.categoryPhotoUrl}
            onChange={(e) => updateField("categoryPhotoUrl", e.target.value)}
          />
          {errors.categoryPhotoUrl && (
            <div className={styles.errorText}>{errors.categoryPhotoUrl}</div>
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
  );
}
