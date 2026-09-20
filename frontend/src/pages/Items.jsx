import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/Items.module.css";
import { useNavigate } from "react-router-dom";

import ItemEditModal from "../components/ItemEditModal";
import AddItemModal from "../components/AddItemModal";
import DeleteItemModal from "../components/DeleteItemModal";
import BulkImportModal from "../components/BulkImportModal";

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const navigate = useNavigate();

  async function loadItems() {
    const data = await API.getItems();
    setItems(data.items);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.vendor.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || item.categoryPhotoUrl === categoryFilter;

    const matchesVendor = vendorFilter === "" || item.vendor === vendorFilter;

    return matchesSearch && matchesCategory && matchesVendor;
  });

  return (
    <div className={styles.itemsPage}>
      <h1>Items</h1>

      <div className={styles.itemsControls}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.categoryFilter}
        >
          <option value="">All Categories</option>
          {[...new Set(items.map((i) => i.categoryPhotoUrl))].map(
            (cat, idx) => (
              <option key={idx} value={cat}>
                Category {idx + 1}
              </option>
            ),
          )}
        </select>

        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="">All Vendors</option>
          {[...new Set(items.map((i) => i.vendor))].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <button
          className={styles.addItemButton}
          onClick={() => setShowAddModal(true)}
        >
          + Add Item
        </button>
        <button
          className={styles.bulkImportButton}
          onClick={() => setShowBulkModal(true)}
        >
          Import CSV
        </button>
      </div>

      <div className={styles.itemsGrid}>
        {filteredItems.map((item) => (
          <div className={styles.itemCard} key={item.itemId}>
            {item.photoUrl ? (
              <img
                src={item.photoUrl}
                alt={item.name}
                className={styles.itemPhoto}
              />
            ) : (
              <div className={styles.itemPhoto + " " + styles.placeholder}>
                No Photo
              </div>
            )}

            <div className={styles.itemInfo}>
              <h3>{item.name}</h3>
              <p>{item.vendor}</p>

              {item.categoryPhotoUrl ? (
                <img
                  src={item.categoryPhotoUrl}
                  alt="Category"
                  className={styles.categoryPhoto}
                />
              ) : (
                <div
                  className={styles.categoryPhoto + " " + styles.placeholder}
                >
                  No Category Photo
                </div>
              )}

              <p>Case Size: {item.units?.caseSize ?? "N/A"}</p>
              <p>Bag Size: {item.units?.bagSize ?? "N/A"}</p>
              <p>Cambro Size: {item.units?.cambroSize ?? "N/A"}</p>

              <p>Barcode: {item.barcode || "None"}</p>

              <button
                className={styles.editItemButton}
                onClick={() => {
                  setEditingItem(item);
                  setShowModal(true);
                }}
              >
                Edit
              </button>
              <button
                className={styles.deleteItemButton}
                onClick={() => {
                  setItemToDelete(item);
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </button>
              <button
                className={styles.viewDetailsButton}
                onClick={() => navigate(`/items/${item.itemId}`)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <ItemEditModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={async (updatedItem) => {
            await API.updateItem(editingItem.itemId, updatedItem);
            setShowModal(false);
            loadItems();
          }}
        />
      )}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSave={async (newItem) => {
            await API.createItem(newItem);
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
      {showDeleteModal && (
        <DeleteItemModal
          item={itemToDelete}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await API.deleteItem(itemToDelete.itemId);
            setShowDeleteModal(false);
            loadItems();
          }}
        />
      )}
      {showBulkModal && (
        <BulkImportModal
          onClose={() => setShowBulkModal(false)}
          onUpload={async (file) => {
            await API.uploadCSV(file);
            setShowBulkModal(false);
            loadItems();
          }}
        />
      )}
    </div>
  );
}
