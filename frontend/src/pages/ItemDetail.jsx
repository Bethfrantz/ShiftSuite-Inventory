import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../styles/pages/ItemDetail.module.css";
import ItemEditModal from "../components/ItemEditModal";
import DeleteItemModal from "../components/DeleteItemModal";

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);

  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get("category");

  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    if (editingItem || deletingItem) {
      document.body.style.overflow = "hidden"; // Disable scrolling when modal is open
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling when modal is closed
    }
  }, [editingItem, deletingItem]);

  async function loadItem() {
    const data = await API.getItem(itemId);
    setItem(data);
  }

  async function loadCategories() {
    const data = await API.getCategories();
    setCategories(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadItem();
    loadCategories();
  }, [itemId]);

  if (!item) return <div>Loading...</div>;

  const category =
    Array.isArray(categories) && categories.length > 0
      ? categories.find((c) => c._id === item.categoryId)
      : null;

  return (
    <>
      {/* PAGE CONTENT */}
      <div className={styles.itemDetailPage}>
        <button
          className={styles.backButton}
          onClick={() =>
            navigate(categoryId ? `/categories/${categoryId}` : "/items")
          }
        >
          ← Back to Items
        </button>

        <div className={styles.itemDetailCard}>
          <div className={styles.itemDetailLeft}>
            {item.photoUrl ? (
              <img
                src={item.photoUrl}
                alt={item.name}
                className={styles.itemDetailPhoto}
              />
            ) : (
              <div
                className={styles.itemDetailPhoto + " " + styles.placeholder}
              >
                No Photo
              </div>
            )}

            {category ? (
              <img
                src={category.photoUrl}
                alt={category.name}
                className={styles.categoryPhoto}
              />
            ) : (
              <div className={styles.categoryPhoto + " " + styles.placeholder}>
                No Category Photo
              </div>
            )}
          </div>

          <div className={styles.itemDetailRight}>
            <h1>{item.name}</h1>
            <p>
              <strong>Vendor:</strong> {item.vendor}
            </p>
            <p>
              <strong>Barcode:</strong> {item.barcode || "None"}
            </p>

            <div className={styles.unitsBlock}>
              <p>
                <strong>Case Size:</strong> {item.units?.caseSize ?? "N/A"}
              </p>
              <p>
                <strong>Bag Size:</strong> {item.units?.bagSize ?? "N/A"}
              </p>
              <p>
                <strong>Cambro Size:</strong> {item.units?.cambroSize ?? "N/A"}
              </p>
              <p>
                <strong>Allow Cambros:</strong>{" "}
                {item.units?.allowCambros ? "Yes" : "No"}
              </p>
              <p>
                <strong>Allow Singles:</strong>{" "}
                {item.units?.allowSingles ? "Yes" : "No"}
              </p>
            </div>

            <p>
              <strong>Par:</strong> {item.par}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {item.description || "No description"}
            </p>

            <div className={styles.itemDetailActions}>
              <button
                className={styles.editButton}
                onClick={() => setEditingItem(item)}
              >
                Edit Item
              </button>

              <button
                className={styles.deleteButton}
                onClick={() => setDeletingItem(item)}
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS — OUTSIDE PAGE CONTAINER */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (updated) => {
            await API.updateItem(item.itemId, updated);
            setEditingItem(null);
            loadItem();
          }}
        />
      )}

      {deletingItem && (
        <DeleteItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={async () => {
            await API.deleteItem(item.itemId);
            navigate("/items");
          }}
        />
      )}
    </>
  );
}
