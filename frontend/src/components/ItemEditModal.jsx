import "./ItemEditModal.css";

export default function ItemEditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name,
    vendor: item.vendor,
    barcode: item.barcode,
    units: item.units,
    par: item.par,
    photoUrl: item.photoUrl,
    categoryPhotoUrl: item.categoryPhotoUrl,
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    onSave(form);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Edit Item</h2>

        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />

        <label>Vendor</label>
        <input
          type="text"
          value={form.vendor}
          onChange={(e) => updateField("vendor", e.target.value)}
        />

        <label>Barcode</label>
        <input
          type="text"
          value={form.barcode}
          onChange={(e) => updateField("barcode", e.target.value)}
        />

        <label>Units</label>
        <input
          type="text"
          value={form.units}
          onChange={(e) => updateField("units", e.target.value)}
        />

        <label>Par</label>
        <input
          type="number"
          value={form.par}
          onChange={(e) => updateField("par", e.target.value)}
        />

        <label>Item Photo URL</label>
        <input
          type="text"
          value={form.photoUrl}
          onChange={(e) => updateField("photoUrl", e.target.value)}
        />

        <label>Category Photo URL</label>
        <input
          type="text"
          value={form.categoryPhotoUrl}
          onChange={(e) => updateField("categoryPhotoUrl", e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-save" onClick={handleSubmit}>
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
