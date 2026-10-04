import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../styles/pages/EditCategory.module.css";

export default function EditCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [active, setActive] = useState(true);

  async function loadCategory() {
    const data = await API.getCategory(categoryId);
    setCategory(data);
    setName(data.name);
    setDescription(data.description);
    setPhotoUrl(data.photoUrl);
    setActive(data.active);
  }

  useEffect(() => {
    loadCategory();
  }, [categoryId]);

  async function handleSave() {
    await API.updateCategory(categoryId, {
      name,
      description,
      photoUrl,
      active,
    });

    alert("Category updated!");
    navigate("/categories");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this category?")) return;

    await API.deleteCategory(categoryId);
    alert("Category deleted.");
    navigate("/categories");
  }

  if (!category) return <div>Loading...</div>;

  return (
    <div className={styles.editCategoryPage}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/categories")}
      >
        ← Back to Categories
      </button>

      <h1>Edit Category</h1>

      <div className={styles.editCategoryForm}>
        {/* Photo Preview */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className={styles.categoryPhotoPreview}
          />
        ) : (
          <div className={styles.categoryPhotoPlaceholder}>No Photo</div>
        )}

        {/* Name */}
        <label>Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Description */}
        <label>Description</label>
        <textarea
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Photo URL */}
        <label>Photo URL</label>
        <input
          type="text"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />

        {/* Active Toggle */}
        <label>Active</label>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value === "true")}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {/* Buttons */}
        <div className={styles.buttonRow}>
          <button className={styles.saveButton} onClick={handleSave}>
            Save Category
          </button>

          <button className={styles.deleteButton} onClick={handleDelete}>
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
}
