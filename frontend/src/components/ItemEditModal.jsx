import { useState } from "react";
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

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    onSave(form);
  }

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={modalStyles.modalBox}>
        <div className={modalStyles.modalHeader}>
          <h2>Edit Item</h2>
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

          <label className={styles.modalLabel}>Vendor</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.vendor}
            onChange={(e) => updateField("vendor", e.target.value)}
          />

          <label className={styles.modalLabel}>Barcode</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.barcode}
            onChange={(e) => updateField("barcode", e.target.value)}
          />

          <label className={styles.modalLabel}>Units</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.units}
            onChange={(e) => updateField("units", e.target.value)}
          />

          <label className={styles.modalLabel}>Par</label>
          <input
            className={styles.modalInput}
            type="number"
            value={form.par}
            onChange={(e) => updateField("par", e.target.value)}
          />

          <label className={styles.modalLabel}>Item Photo URL</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.photoUrl}
            onChange={(e) => updateField("photoUrl", e.target.value)}
          />

          <label className={styles.modalLabel}>Category Photo URL</label>
          <input
            className={styles.modalInput}
            type="text"
            value={form.categoryPhotoUrl}
            onChange={(e) => updateField("categoryPhotoUrl", e.target.value)}
          />
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
    </div>
  );
}
