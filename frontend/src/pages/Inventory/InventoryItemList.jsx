export default function InventoryItemList({
  category,
  items,
  onSelectItem,
  onBack,
  user,
  blindMode, // <-- You MUST receive blindMode here
}) {
  return (
    <div>
      <button onClick={onBack}>Back to Categories</button>
      <h2>{category.name}</h2>

      <div className="item-grid">
        {items.map((item) => (
          <div
            key={item._id}
            className="item-card"
            onClick={() => onSelectItem(item)}
          >
            <img src={item.photoUrl} className="item-photo" />
            <h3>{item.name}</h3>
            <p>{item.vendor}</p>

            {/* Hide PAR in blind mode */}
            {!blindMode && <p>Par: {item.par}</p>}

            {/* District + Corporate can edit/delete */}
            {(user?.role === "district" || user?.role === "corporate") && (
              <div className="admin-controls">
                <button>Edit</button>
                <button>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
