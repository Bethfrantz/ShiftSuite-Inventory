import { useEffect, useState } from "react";
import API from "../api/api";
import "./Inventory.css";

export default function Inventory() {
  const [storeId, setStoreId] = useState("");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [barcode, setBarcode] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [parFilter, setParFilter] = useState("");

  async function loadItems() {
    if (!storeId) return;
    const data = await API.getInventoryItems(storeId);
    setItems(data);
  }

  useEffect(() => {
    loadItems();
  }, [storeId]);

  function handleCountChange(itemId, value) {
    setCounts((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleBarcodeLookup() {
    const item = await API.lookupBarcode(barcode);

    if (item && item._id) {
      document.getElementById(`item-${item._id}`).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.vendor.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || item.categoryPhotoUrl === categoryFilter;

    const matchesVendor = vendorFilter === "" || item.vendor === vendorFilter;

    const matchesPar =
      parFilter === "" ||
      (parFilter === "below" &&
        item.par > 0 &&
        (counts[item.itemId] || 0) < item.par) ||
      (parFilter === "above" && (counts[item.itemId] || 0) >= item.par);

    return matchesSearch && matchesCategory && matchesVendor && matchesPar;
  });

  async function handleSave() {
    const payload = Object.entries(counts).map(([itemId, count]) => ({
      itemId,
      count: Number(count),
      unitType: "case",
    }));

    await API.submitCounts(storeId, payload);
    alert("Counts saved!");
  }

  return (
    <div className="inventory-page">
      <h1>Inventory</h1>

      <div className="inventory-controls">
        {/* Store Selector */}
        <select onChange={(e) => setStoreId(e.target.value)}>
          <option value="">Select Store</option>
          <option value="1">Store 1</option>
          <option value="2">Store 2</option>
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
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

        {/* Vendor Filter */}
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

        {/* Par Filter */}
        <select
          value={parFilter}
          onChange={(e) => setParFilter(e.target.value)}
        >
          <option value="">Par Status</option>
          <option value="below">Below Par</option>
          <option value="above">Above Par</option>
        </select>

        {/* Barcode */}
        <input
          type="text"
          placeholder="Scan or enter barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        <button onClick={handleBarcodeLookup}>Lookup</button>

        {/* Print Buttons */}
        <button
          className="print-button"
          onClick={() => window.open(`/print/inventory/${storeId}`, "_blank")}
        >
          Print Inventory
        </button>

        <button
          className="print-button"
          onClick={() =>
            window.open(`/print/inventory-barcodes/${storeId}`, "_blank")
          }
        >
          Print With Barcodes
        </button>
      </div>

      <div className="inventory-grid">
        {filteredItems.map((item) => (
          <div
            className="item-card"
            id={`item-${item.itemId}`}
            key={item.itemId}
          >
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.name} className="item-photo" />
            ) : (
              <div className="item-photo placeholder">No Photo</div>
            )}

            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.vendor}</p>

              {item.categoryPhotoUrl ? (
                <img
                  src={item.categoryPhotoUrl}
                  alt="Category"
                  className="category-photo"
                />
              ) : (
                <div className="category-photo placeholder">
                  No Category Photo
                </div>
              )}

              <p>Par: {item.par}</p>

              <input
                type="number"
                placeholder="Enter count"
                onChange={(e) => handleCountChange(item.itemId, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="save-button" onClick={handleSave}>
        Save Counts
      </button>
    </div>
  );
}
