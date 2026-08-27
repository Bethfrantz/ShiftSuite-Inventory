import { useState } from "react";
import "./CategoryModal.css";

export default function AddCategoryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Add Category</h2>

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
