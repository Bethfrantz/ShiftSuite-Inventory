import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../styles/pages/CategoryDetail.module.css";

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const categories = await API.getCategories();
      const itemsData = await API.getItems();

      // Find the category by ID
      const foundCategory = categories.find(
        (c) => String(c._id) === String(id),
      );
      setCategory(foundCategory);

      // Filter items belonging to this category
      const filteredItems = itemsData.filter((item) => {
        const cat = item.categoryId;
        if (!cat) return false;

        return String(cat._id) === String(id) || String(cat.id) === String(id);
      });

      setItems(filteredItems);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load category detail:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!category) {
    return (
      <div className={styles.notFound}>
        <h2>Category Not Found</h2>
        <button onClick={() => navigate("/categories")}>
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div className={styles.categoryDetailPage}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/categories")}
      >
        ← Back to Categories
      </button>

      <div className={styles.headerSection}>
        {category.photoUrl ? (
          <img
            src={category.photoUrl}
            alt={category.name}
            className={styles.categoryPhoto}
          />
        ) : (
          <div className={styles.categoryPhoto + " " + styles.placeholder}>
            No Photo
          </div>
        )}

        <div className={styles.categoryInfo}>
          <h1>{category.name}</h1>
          <p>{category.description || "No description provided."}</p>

          <p className={styles.itemCount}>
            Items in this category: {items.length}
          </p>
        </div>
      </div>

      <h2 className={styles.itemsHeader}>Items in {category.name}</h2>

      <div className={styles.itemsGrid}>
        {items.map((item) => (
          <div className={styles.itemCard} key={item._id}>
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

            <h3>{item.name}</h3>
            <p>{item.vendor}</p>

            <button
              className={styles.viewButton}
              onClick={() => navigate(`/items/${item._id}?category=${id}`)}
            >
              View Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
