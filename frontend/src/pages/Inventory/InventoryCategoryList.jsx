export default function InventoryCategoryList({
  categories,
  onSelect,
  blindMode,
}) {
  return (
    <div className="category-grid">
      {categories.map((cat) => (
        <div
          key={cat._id}
          className="category-card"
          onClick={() => onSelect(cat)}
        >
          <img src={cat.photoUrl} className="category-photo" />
          <h3>{cat.name}</h3>
        </div>
      ))}
    </div>
  );
}
