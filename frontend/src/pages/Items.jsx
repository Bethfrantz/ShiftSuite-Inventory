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
    setItems(data);
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
      categoryFilter === "" || item.categoryId?.photoUrl === categoryFilter;

    const matchesVendor = vendorFilter === "" || item.vendor === vendorFilter;

    return matchesSearch && matchesCategory && matchesVendor;
  });
  // Group items by category
  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const cat = item.categoryId;
    if (!cat) return acc;

    if (!acc[cat._id]) {
      acc[cat._id] = {
        category: cat,
        items: [],
      };
    }

    acc[cat._id].items.push(item);
    return acc;
  }, {});

  return (
    <div className={styles.itemsPage}>
      <h1>Items</h1>

      <div className={styles.itemsControls}>... filters, buttons ...</div>

      {/* CATEGORY GRID */}
      <div className={styles.categoryGrid}>
        {Object.values(groupedByCategory).map((group) => (
          <div className={styles.categoryCard} key={group.category._id}>
            {group.category.photoUrl ? (
              <img
                src={group.category.photoUrl}
                alt={group.category.name}
                className={styles.categoryPhoto}
              />
            ) : (
              <div className={styles.categoryPhoto + " " + styles.placeholder}>
                No Category Photo
              </div>
            )}

            <h2>{group.category.name}</h2>

            <div className={styles.itemsInsideCategory}>
              {group.items.map((item) => (
                <div className={styles.itemCard} key={item._id}>
                  <h4>{item.name}</h4>
                  <p>{item.vendor}</p>

                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className={styles.itemPhotoSmall}
                    />
                  ) : (
                    <div
                      className={
                        styles.itemPhotoSmall + " " + styles.placeholder
                      }
                    >
                      No Photo
                    </div>
                  )}

                  <button
                    className={styles.viewDetailsButton}
                    onClick={() => navigate(`/items/${item.itemId}`)}
                  >
                    View Details
                  </button>
                </div>
              ))}
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
