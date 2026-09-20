import { useState } from "react";
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
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Edit Category</h2>

        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />

        <label>Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <label>Photo URL</label>
        <input
          type="text"
          value={form.photoUrl}
          onChange={(e) => updateField("photoUrl", e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-save" onClick={() => onSave(form)}>
            Save
          </button>
          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
