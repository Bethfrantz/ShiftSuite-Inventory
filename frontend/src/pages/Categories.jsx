import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/Categories.module.css";
import CategoryEditModal from "../components/CategoryEditModal";
import AddCategoryModal from "../components/AddCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);

  async function loadCategories() {
    const data = await API.getCategories();
    setCategories(data);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.categoriesPage}>
      <h1>Categories</h1>

      <div className={styles.categoriesControls}>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        <button
          className={styles.addCategoryButton}
          onClick={() => setShowAddModal(true)}
        >
          + Add Category
        </button>
      </div>

      <div className={styles.categoriesGrid}>
        {filteredCategories.map((cat) => (
          <div className={styles.categoryCard} key={cat._id}>
            {cat.photoUrl ? (
              <img
                src={cat.photoUrl}
                alt={cat.name}
                className={styles.categoryPhoto}
              />
            ) : (
              <div className={styles.categoryPhoto + " " + styles.placeholder}>
                No Photo
              </div>
            )}

            <h3>{cat.name}</h3>
            <p>{cat.description || "No description"}</p>

            <div className={styles.categoryActions}>
              <button
                className={styles.editCategoryButton}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowEditModal(true);
                }}
              >
                Edit
              </button>

              <button
                className={styles.deleteCategoryButton}
                onClick={() => {
                  setSelectedCategory(cat);
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSave={async (newCat) => {
            await API.createCategory(newCat);
            setShowAddModal(false);
            loadCategories();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <CategoryEditModal
          category={selectedCategory}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedCat) => {
            await API.updateCategory(selectedCategory._id, updatedCat);
            setShowEditModal(false);
            loadCategories();
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteCategoryModal
          category={selectedCategory}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await API.deleteCategory(selectedCategory._id);
            setShowDeleteModal(false);
            loadCategories();
          }}
        />
      )}
    </div>
  );
}
