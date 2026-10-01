import { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../styles/pages/Categories.module.css";
import CategoryEditModal from "../components/CategoryEditModal";
import AddCategoryModal from "../components/AddCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";
import { useNavigate } from "react-router-dom";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

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
      <div className={styles.categoryGrid}>
        {filteredCategories.map((cat) => (
          <div
            className={styles.categoryCard}
            key={cat._id}
            onClick={() => navigate(`/categories/${cat._id}`)}
          >
            {/* Category Photo */}
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

            {/* Category Name */}
            <h2>{cat.name}</h2>

            {/* Category Description */}
            <p className={styles.categoryDescription}>
              {cat.description || "No description provided."}
            </p>

            {/* Actions */}
            <div className={styles.categoryActions}>
              <button
                className={styles.editCategoryButton}
                onClick={(e) => {
                  e.stopPropagation(); // prevent card click
                  setSelectedCategory(cat);
                  setShowEditModal(true);
                }}
              >
                Edit
              </button>

              <button
                className={styles.deleteCategoryButton}
                onClick={(e) => {
                  e.stopPropagation(); // prevent card click
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
