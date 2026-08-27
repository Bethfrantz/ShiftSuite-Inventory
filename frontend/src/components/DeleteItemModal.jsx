import "./DeleteItemModal.css";

export default function DeleteItemModal({ item, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box delete-box">
        <h2>Delete Item</h2>

        <p>
          Are you sure you want to delete <strong>{item.name}</strong>? This
          action cannot be undone.
        </p>

        <div className="modal-actions">
          <button className="modal-delete" onClick={onConfirm}>
            Delete
          </button>

          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
